import ServiceCategory from '../models/ServiceCategory.js';
import { logAuditAction } from '../services/auditService.js';

// @desc    Get all active service categories
// @route   GET /api/v1/categories
// @access  Public / Authenticated
export const getCategories = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const categories = await ServiceCategory.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category by ID
// @route   GET /api/v1/categories/:id
// @access  Public / Authenticated
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Service category not found.' });
    }
    res.status(200).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new service category
// @route   POST /api/v1/categories
// @access  Private (Operations Manager, Platform Admin)
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, subcategories } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    // Check duplicate name
    const existing = await ServiceCategory.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Category '${name}' already exists.` });
    }

    // Check subcategory names uniqueness
    if (subcategories && Array.isArray(subcategories)) {
      const subNames = subcategories.map(s => s.name?.toLowerCase()?.trim());
      const hasDuplicates = new Set(subNames).size !== subNames.length;
      if (hasDuplicates) {
        return res.status(400).json({ success: false, message: 'Subcategory names within a category must be unique.' });
      }
    }

    const category = await ServiceCategory.create({
      name: name.trim(),
      description: description || '',
      icon: icon || 'wrench',
      subcategories: subcategories || []
    });

    // Audit Logging
    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'CATEGORY_CREATED',
      targetEntity: 'ServiceCategory',
      targetEntityId: category._id,
      details: { name: category.name, subcategoriesCount: category.subcategories.length },
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Service category created successfully.',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service category details and subcategories
// @route   PUT /api/v1/categories/:id
// @access  Private (Operations Manager, Platform Admin)
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, icon, subcategories, isActive } = req.body;

    let category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Service category not found.' });
    }

    // Name uniqueness check if updating name
    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existing = await ServiceCategory.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
      if (existing) {
        return res.status(400).json({ success: false, message: `Category '${name}' already exists.` });
      }
      category.name = name.trim();
    }

    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    if (subcategories && Array.isArray(subcategories)) {
      const subNames = subcategories.map(s => s.name?.toLowerCase()?.trim());
      if (new Set(subNames).size !== subNames.length) {
        return res.status(400).json({ success: false, message: 'Subcategory names within a category must be unique.' });
      }
      category.subcategories = subcategories;
    }

    await category.save();

    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'CATEGORY_UPDATED',
      targetEntity: 'ServiceCategory',
      targetEntityId: category._id,
      details: { name: category.name, isActive: category.isActive },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Service category updated successfully.',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle category active state (Soft deactivation)
// @route   PATCH /api/v1/categories/:id/deactivate
// @access  Private (Operations Manager, Platform Admin)
export const toggleCategoryActive = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Service category not found.' });
    }

    category.isActive = !category.isActive;
    await category.save();

    await logAuditAction({
      actor: req.user._id,
      role: req.user.role,
      action: 'CATEGORY_STATUS_TOGGLED',
      targetEntity: 'ServiceCategory',
      targetEntityId: category._id,
      details: { name: category.name, isActive: category.isActive },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Category '${category.name}' ${category.isActive ? 'activated' : 'deactivated'} successfully.`,
      category
    });
  } catch (error) {
    next(error);
  }
};
