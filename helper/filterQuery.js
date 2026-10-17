class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const includesQuery = ['page', 'sort', 'limit', 'fields'];

    includesQuery.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    }
    return this;
  }

  fields() {
    if (this.queryString.fields) {
      const fiedlsBy = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fiedlsBy);
    }

    return this;
  }

  page() {
    const page = Number(this.queryString.page);
    const limit = Number(this.queryString.limit);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default ApiFeatures;
