const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

/**
 * Generic document delete function
 * @param {mongoose.model} Model an mongoose schema model
 */
exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    // in case of no document, immediately returns error
    if (!document)
      return next(new AppError('No document found with that ID', 404));

    // case of delete, status is 204(no content), data is null
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

/**
 * Generic document update function
 * @param {mongoose.model} Model an mongoose schema model
 */
exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    // find by id and update its body parameters, duh :D
    // will work only with 'patch' requests, not put, since 'put' replaces the object
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }); // new here means that the newly updated document is returned

    // in case of no document, immediately returns error
    if (!document)
      return next(new AppError('No document found with that ID', 404));

    res.status(200).json({
      status: 'success',
      data: {
        data: document
      }
    });
  });

/**
 * Generic document create function
 * @param {mongoose.model} Model an mongoose schema model
 */
exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    // const newTour = new Tour({});
    // newTour.save();
    // but a better way: 'Tour.create({})' does both the above :D
    const newDocument = await Model.create(req.body);

    res.status(201).json({
      // 201 stands for created status
      status: 'success',
      data: {
        data: newDocument
      }
    });
  });

/**
 * Generic document get function, with the
 * option to populate reference fields.
 * @param {mongoose.model} Model an mongoose schema model
 * @param {String} populateOptions the attribute name to populate, defaults to null
 */
exports.getOne = (Model, populateOptions = null) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions); // check the document model, for virtual populate

    const document = await query;

    // in case of no document, immediately returns error
    if (!document)
      return next(new AppError('No document found with that ID', 404));

    res.status(200).json({
      status: 'success',
      data: {
        data: document
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews for tour (hack)
    // only reviews that match tour id will be found, instead of all of them which wouldn't make sense
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const documents = await features.query; //.explain(); for dev statistics
    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        data: documents
      }
    });
  });
