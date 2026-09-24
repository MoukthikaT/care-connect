import ProviderProfile from '../models/ProviderProfile.js';
import User from '../models/User.js';
import ServiceCategory from '../models/ServiceCategory.js';
import { uploadToCloudinary } from '../services/mediaService.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditAction } from '../services/auditService.js';
import { ROLES } from '../config/constants.js';

// @desc    Get current authenticated provider's profile
// @route   GET /api/v1/providers/profile/me
// @access  Private (Service Provider)
export const getMyProviderProfile = async (req, res, next) => {
  try {
    let profile = await ProviderProfile.findOne({ user: req.user._id })
      .populate('user', 'name email phone avatar status role')
      .populate('categories', 'name icon');

    if (!profile) {
      // Auto-instantiate empty profile if provider visits for first time
      profile = await ProviderProfile.create({ user: req.user._id });
      profile = await profile.populate('user', 'name email phone avatar status role');
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Get provider profile by ID
// @route   GET /api/v1/providers/:id
// @access  Public / Authenticated
export const getProviderById = async (req, res, next) => {
  try {
    const profile = await ProviderProfile.findById(req.params.id)
      .populate('user', 'name email phone avatar status role')
      .populate('categories', 'name icon');

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or Update Service Provider Profile (Skills, GeoJSON Area, Hourly Rate, Bio)
// @route   PUT /api/v1/providers/profile
// @access  Private (Service Provider)
export const updateProviderProfile = async (req, res, next) => {
  try {
    const {
      bio,
      businessName,
      hourlyRate,
      skills,
      categories,
      serviceAreas,
      isAvailableForEmergency
    } = req.body;

    // GeoJSON Service Area Validation
    if (serviceAreas && Array.isArray(serviceAreas)) {
      for (const area of serviceAreas) {
        if (!area.center || !area.center.coordinates || !Array.isArray(area.center.coordinates) || area.center.coordinates.length !== 2) {
          return res.status(400).json({
            success: false,
            message: 'GeoJSON service area must specify center coordinates [longitude, latitude].'
          });
        }
        const [lng, lat] = area.center.coordinates;
        if (typeof lng !== 'number' || typeof lat !== 'number' || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          return res.status(400).json({
            success: false,
            message: `Invalid GeoJSON coordinates [${lng}, ${lat}]. Longitude must be -180..180 and Latitude -90..90.`
          });
        }
        if (area.radiusInKm !== undefined && (typeof area.radiusInKm !== 'number' || area.radiusInKm <= 0)) {
          return res.status(400).json({
            success: false,
            message: 'Service area radiusInKm must be a positive number.'
          });
        }
      }
    }

    // Skills Validation against ServiceCategories if provided
    if (skills && Array.isArray(skills)) {
      const activeCats = await ServiceCategory.find({ isActive: true });
      const validSkillsSet = new Set();
      activeCats.forEach(cat => {
        cat.subcategories.forEach(sub => {
          sub.requiredSkills.forEach(s => validSkillsSet.add(s.toLowerCase()));
          validSkillsSet.add(sub.name.toLowerCase());
        });
        validSkillsSet.add(cat.name.toLowerCase());
      });

      // Filter & sanitize unique skills
      const cleanedSkills = [...new Set(skills.map(s => String(s).trim()))];
      req.body.skills = cleanedSkills;
    }

    let profile = await ProviderProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new ProviderProfile({ user: req.user._id });
    }

    if (bio !== undefined) profile.bio = bio;
    if (businessName !== undefined) profile.businessName = businessName;
    if (hourlyRate !== undefined) profile.hourlyRate = Math.max(0, Number(hourlyRate));
    if (skills !== undefined) profile.skills = req.body.skills;
    if (categories !== undefined) profile.categories = categories;
    if (serviceAreas !== undefined) profile.serviceAreas = serviceAreas;
    if (isAvailableForEmergency !== undefined) profile.isAvailableForEmergency = isAvailableForEmergency;

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Provider profile updated successfully.',
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload Provider Verification Document to Cloudinary via Multer memoryStorage
// @route   POST /api/v1/providers/documents
// @access  Private (Service Provider)
export const uploadVerificationDoc = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a document file to upload.' });
    }

    const { docName } = req.body;
    if (!docName || !docName.trim()) {
      return res.status(400).json({ success: false, message: 'Document name/type is required (e.g. License, Trade Certification).' });
    }

    // Stream buffer to Cloudinary API
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'provider_verifications',
      req.file.originalname
    );

    let profile = await ProviderProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = await ProviderProfile.create({ user: req.user._id });
    }

    const docEntry = {
      docName: docName.trim(),
      fileUrl: uploadResult.url,
      cloudinaryId: uploadResult.cloudinaryId,
      uploadedAt: new Date()
    };

    profile.verificationDocuments.push(docEntry);
    profile.verificationStatus = 'Pending'; // Reset status to pending review
    await profile.save();

    // Create Notification for Ops Managers
    const opsManagers = await User.find({ role: ROLES.OPS_MANAGER });
    for (const ops of opsManagers) {
      await createNotification({
        recipient: ops._id,
        type: 'SYSTEM_ALERT',
        title: 'New Provider Verification Submission',
        message: `Provider ${req.user.name} submitted a new verification document: ${docName}.`,
        relatedEntity: { entityType: 'ProviderProfile', entityId: profile._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Verification document uploaded successfully to Cloudinary.',
      document: docEntry,
      verificationStatus: profile.verificationStatus
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Queue of Pending Provider Verifications
// @route   GET /api/v1/providers/verifications/pending
// @access  Private (Operations Manager, Platform Admin)
export const getPendingVerifications = async (req, res, next) => {
  try {
    const { status = 'Pending' } = req.query;
    const profiles = await ProviderProfile.find({ verificationStatus: status })
      .populate('user', 'name email phone status avatar createdAt')
      .populate('categories', 'name');

    res.status(200).json({
      success: true,
      count: profiles.length,
      verifications: profiles
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or Reject Provider Verification Status
// @route   PATCH /api/v1/providers/:id/verify
// @access  Private (Operations Manager, Platform Admin)
export const verifyProvider = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Verified' or 'Rejected'."
      });
    }

    if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required when rejecting a provider verification.'
      });
    }

    const profile = await ProviderProfile.findById(req.params.id).populate('user');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Provider profile not found.' });
    }

    const providerUserDoc = profile.user;
    const recipientId = (providerUserDoc && providerUserDoc._id) ? providerUserDoc._id : providerUserDoc;

    profile.verificationStatus = status;
    await profile.save();

    // Update user account status if verified
    if (providerUserDoc && typeof providerUserDoc.save === 'function') {
      providerUserDoc.status = status === 'Verified' ? 'Active' : 'Pending Verification';
      await providerUserDoc.save();
    } else if (recipientId) {
      await User.findByIdAndUpdate(recipientId, {
        status: status === 'Verified' ? 'Active' : 'Pending Verification'
      });
    }

    // Create Notification for Provider
    await createNotification({
      recipient: recipientId,
      type: 'SYSTEM_ALERT',
      title: `Provider Verification ${status}`,
      message: status === 'Verified'
        ? 'Congratulations! Your CareConnect provider verification has been approved. You can now receive job requests.'
        : `Your verification request was rejected. Reason: ${rejectionReason}`
    });

    // Log Audit Action
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: status === 'Verified' ? 'PROVIDER_VERIFICATION_APPROVED' : 'PROVIDER_VERIFICATION_REJECTED',
      targetEntity: 'ProviderProfile',
      targetEntityId: profile._id,
      details: {
        providerId: profile.user._id,
        providerName: profile.user.name,
        status,
        rejectionReason: rejectionReason || ''
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Provider '${profile.user.name}' verification set to ${status}.`,
      profile
    });
  } catch (error) {
    next(error);
  }
};
