class APIFeatures {
  // queryString = req.query from express
  // query = the query from mongoose
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // BUILD QUERY ////////////////
    // 1A) Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    // deletes fields that matches in the 'queryObj' keys
    excludedFields.forEach(el => delete queryObj[el]);
    ///////////////////////////////

    // 1B) Advanced filtering /////
    // { difficulty: 'easy', duration: { $gte: '5' } }
    // { difficulty: 'easy', duration: { gte: '5' } }
    // gte, gt, lte, lt
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    ///////////////////////////////

    return this; // 'this' is the entire object, making it possible to chain the functions
  }

  sort() {
    // 2) Sorting /////////////////
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else this.query = this.query.sort('-createdAt'); // default sort
    // sort('price ratingAverage')
    ///////////////////////////////

    return this;
  }

  limitFields() {
    // 3) Field Limiting //////////
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' '); // splits by comma then join them with space
      this.query = this.query.select(fields); // projecting
    } else this.query = this.query.select('-__v'); // adding '-' excludes only this fields, everything else will be sent
    ///////////////////////////////

    return this;
  }

  paginate() {
    // 4) Pagination //////////////
    const page = this.queryString.page * 1 || 1; // '* 1' converts to number, page request OR defaults to number 1
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit; // the number of results to skip in case of page higher than 1

    // page=2&limit=10, 1-10 for page 1, 11-20 for page 2, ...
    this.query = this.query.skip(skip).limit(limit); // here the limit of results for each page is 10

    // This isn't really necessary!
    // // checks if page number has content to show
    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments(); // counts the number of results

    //   // throws an error if the number of results to skip is higher
    //   // than the number of results requested
    //   if (skip >= numTours) throw new Error('This page does not exist!');
    // }
    // //////////////////////////////

    return this;
  }
}

module.exports = APIFeatures;
