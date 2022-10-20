import { Paginate } from '../models/pagination';

export class PaginationService {
  static dataPerPage = 10;
  constructor() {}
  static paginate(query: Paginate) {
    const dataPerPage = query.dataPerPage
      ? query.dataPerPage
      : this.dataPerPage;
    const totalRecords = query.totalData;
    const currentPage = query.currentPage;
    const quotient = totalRecords / dataPerPage;
    const remainder = totalRecords % dataPerPage;

    const totalPages = remainder === 0 ? quotient : Math.floor(quotient) + 1;

    if (typeof currentPage === 'number') {
      if (currentPage >= 1) {
        const pageQuery = {
          skip: currentPage * dataPerPage - dataPerPage,
          take: dataPerPage,
        };
        if (query.query) {
          return { ...query.query, ...pageQuery };
        } else {
          return pageQuery;
        }
      }
    } else {
      return {};
    }
  }

  static paginateQueryBuilder(query: Paginate){

const dataPerPage = query.dataPerPage
      ? query.dataPerPage
      : this.dataPerPage;
    const totalRecords = query.totalData;
    const currentPage = query.currentPage;
    const quotient = totalRecords / dataPerPage;
    const remainder = totalRecords % dataPerPage;

    if (typeof currentPage === 'number') {
      if (currentPage >= 1) {
        const pageQuery = {
          skip: currentPage * dataPerPage - dataPerPage,
          take: dataPerPage,
        };
        // if (query.query) {
        //   return { ...query.query, ...pageQuery };
        // } else {
          return pageQuery;
        // }
      }
    }
  }
}
