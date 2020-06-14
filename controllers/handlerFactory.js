const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
        document
      }
    });
  });

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
        document: newDocument
      }
    });
  });
