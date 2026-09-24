import ServiceRequest from '../models/ServiceRequest.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ProviderProfile from '../models/ProviderProfile.js';
import RuleBasedClassifier from '../services/ai/RuleBasedClassifier.js';
import MatchingEngine from '../services/ai/MatchingEngine.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditAction } from '../services/auditService.js';
import { ROLES } from '../config/constants.js';

// @desc    Live AI Classification Preview (Returns real-time AI triage without saving)
// @route   POST /api/v1/requests/classify-preview
// @access  Private (Authenticated)
export const classifyPreview = async (req, res, next) => {
  try {
    const { description } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description text is required for AI classification.' });
    }

    const aiAnalysis = await RuleBasedClassifier.classifyRequest(description);
    
    // Calculate matched providers count
    let matchedProvidersCount = 0;
    if (aiAnalysis.categoryId) {
      matchedProvidersCount = await ProviderProfile.countDocuments({
        verificationStatus: 'Verified',
        categories: aiAnalysis.categoryId
      });
    }

    res.status(200).json({
      success: true,
      aiAnalysis: {
        ...aiAnalysis,
        matchedProvidersCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Service Request & Auto-Classify using RuleBased AI Engine
// @route   POST /api/v1/requests
// @access  Private (Customer)
export const createServiceRequest = async (req, res, next) => {
  try {
    const {
      title,
      description,
      categoryId,
      location,
      preferredSchedule,
      urgency,
      mediaAttachments
    } = req.body;

    if (!title || !description || !location || !location.address || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, problem description, location address, and GeoJSON coordinates.'
      });
    }

    const coordsArray = Array.isArray(location.coordinates)
      ? location.coordinates
      : (location.coordinates?.coordinates || [0, 0]);
    const [lng, lat] = coordsArray;
    if (typeof lng !== 'number' || typeof lat !== 'number' || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: `Invalid location coordinates [${lng}, ${lat}]. Longitude must be -180..180 and Latitude -90..90.`
      });
    }

    // Trigger Rule-Based AI Classification Engine
    const aiAnalysis = await RuleBasedClassifier.classifyRequest(description);

    let targetCategory = categoryId && categoryId.trim() !== '' ? categoryId : aiAnalysis.categoryId;

    if (!targetCategory) {
      return res.status(409).json({ success: false, message: 'No active service category matches this request. Please contact support or try again when categories are available.' });
    }

    const categoryDoc = await ServiceCategory.findOne({ _id: targetCategory, isActive: true });
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: 'The selected service category is unavailable. Please choose an active category.' });
    }

    const serviceRequest = await ServiceRequest.create({
      customer: req.user._id,
      category: categoryDoc._id,
      title: title.trim(),
      description: description.trim(),
      mediaAttachments: mediaAttachments || [],
      location: {
        address: location.address,
        coordinates: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      },
      preferredSchedule: preferredSchedule || {},
      urgency: urgency || aiAnalysis.urgency || 'Normal',
      aiAnalysis,
      status: 'Open'
    });

    // Create Notification
    await createNotification({
      recipient: req.user._id,
      type: 'SYSTEM_ALERT',
      title: 'Service Request Posted',
      message: `Your request "${serviceRequest.title}" was created and classified under ${categoryDoc.name}.`,
      relatedEntity: { entityType: 'ServiceRequest', entityId: serviceRequest._id }
    });

    // Audit Log
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'SERVICE_REQUEST_CREATED',
      targetEntity: 'ServiceRequest',
      targetEntityId: serviceRequest._id,
      details: { category: categoryDoc.name, urgency: serviceRequest.urgency, confidenceScore: aiAnalysis.confidenceScore },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Service request created and classified successfully.',
      serviceRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get service requests posted by current customer
// @route   GET /api/v1/requests/my
// @access  Private (Customer)
export const getMyRequests = async (req, res, next) => {
  try {
    const requests = await ServiceRequest.find({ customer: req.user._id })
      .populate('category', 'name icon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get matched service requests for Service Provider (Filtered by provider's skills/categories)
// @route   GET /api/v1/requests/matched
// @access  Private (Service Provider)
export const getMatchedRequestsForProvider = async (req, res, next) => {
  try {
    const providerProfile = await ProviderProfile.findOne({ user: req.user._id });
    if (!providerProfile || providerProfile.verificationStatus !== 'Verified') {
      return res.status(403).json({
        success: false,
        message: 'Only verified providers with active accounts can view matched job opportunities.'
      });
    }

    const providerSkills = (providerProfile.skills || []).map(s => s.toLowerCase());
    const providerCatIds = providerProfile.categories || [];

    // Find open service requests
    const openRequests = await ServiceRequest.find({ status: { $in: ['Open', 'Quoted'] } })
      .populate('category', 'name icon')
      .sort({ createdAt: -1 });

    // Filter requests matching provider skills or category
    const matched = openRequests.filter(reqDoc => {
      const catMatch = providerCatIds.some(cId => cId.toString() === reqDoc.category?._id?.toString());
      const detected = reqDoc.aiAnalysis?.detectedSkills || [];
      const skillMatch = detected.some(d => providerSkills.includes(d.toLowerCase()));
      return catMatch || skillMatch || providerSkills.length === 0;
    });

    // Sanitize customer data for privacy prior to quote acceptance
    const sanitizedRequests = matched.map(r => {
      const doc = r.toObject();
      doc.customer = { name: doc.customer?.name || 'Customer' };
      return doc;
    });

    res.status(200).json({
      success: true,
      count: sanitizedRequests.length,
      requests: sanitizedRequests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all service requests (Admin / Ops Manager view)
// @route   GET /api/v1/requests
// @access  Private (Operations Manager, Platform Admin)
export const getAllRequests = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const requests = await ServiceRequest.find(filter)
      .populate('customer', 'name email phone')
      .populate('category', 'name icon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single Service Request Details
// @route   GET /api/v1/requests/:id
// @access  Private (Authenticated)
export const getRequestById = async (req, res, next) => {
  try {
    const requestDoc = await ServiceRequest.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('category', 'name icon description');

    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    // Ownership & RBAC Guard
    const isCustomerOwner = req.user.role === ROLES.CUSTOMER && requestDoc.customer._id.toString() === req.user._id.toString();
    const isProvider = req.user.role === ROLES.SERVICE_PROVIDER;
    const isOpsOrAdmin = [ROLES.OPS_MANAGER, ROLES.ADMIN, ROLES.SUPPORT_AGENT].includes(req.user.role);

    if (!isCustomerOwner && !isProvider && !isOpsOrAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You do not have access to view this request.' });
    }

    res.status(200).json({ success: true, request: requestDoc });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a Service Request
// @route   PATCH /api/v1/requests/:id/cancel
// @access  Private (Customer - Request Owner)
export const cancelServiceRequest = async (req, res, next) => {
  try {
    const requestDoc = await ServiceRequest.findById(req.params.id);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    if (requestDoc.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not the owner of this request.' });
    }

    if (!['Open', 'Draft', 'Quoted'].includes(requestDoc.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request in status '${requestDoc.status}'.`
      });
    }

    requestDoc.status = 'Cancelled';
    await requestDoc.save();

    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'SERVICE_REQUEST_CANCELLED',
      targetEntity: 'ServiceRequest',
      targetEntityId: requestDoc._id,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Service request cancelled successfully.',
      request: requestDoc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Ranked Providers for a Service Request using Multi-Factor Matching Engine
// @route   GET /api/v1/requests/:id/ranked-providers
// @access  Private (Customer, Ops Manager, Platform Admin)
export const getRankedProviders = async (req, res, next) => {
  try {
    const requestDoc = await ServiceRequest.findById(req.params.id);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    // Ownership Check
    const isOwner = requestDoc.customer.toString() === req.user._id.toString();
    const isOpsAdmin = [ROLES.OPS_MANAGER, ROLES.ADMIN].includes(req.user.role);
    if (!isOwner && !isOpsAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this request.' });
    }

    const rankedProviders = await MatchingEngine.rankProvidersForRequest(requestDoc);

    res.status(200).json({
      success: true,
      requestId: requestDoc._id,
      count: rankedProviders.length,
      providers: rankedProviders
    });
  } catch (error) {
    next(error);
  }
};
