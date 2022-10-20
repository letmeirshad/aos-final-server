import * as moment from 'moment';
const currentTZ = 'Asia/Calcutta';
export class Dates {
  static getDates(month) {
    const year = this.converttoTZ().year();
    const monthStart = this.converttoTZ([year, month]).startOf('month');
    const monthEnd = this.converttoTZ([year, month]).endOf('month');
    const diff = monthEnd.diff(monthStart, 'days');
    const currMonth = [];
    for (let i = 0; i <= diff; i++) {
      currMonth.push({
        date: monthStart
          .clone()
          .add(i, 'd')
          .format('YYYY-MM-DD'),
        day: monthStart
          .clone()
          .add(i, 'd')
          .day(),
      });
    }
    return currMonth;
  }

  static checkMonth(date, month, year) {
    return this.converttoTZ(date, 'YYYY-MM-DD').month() === month &&
      this.converttoTZ(date, 'YYYY-MM-DD').year() === year
      ? true
      : false;
  }

  static getCurrentMonth() {
    return this.converttoTZ().month();
  }

  static getCurrentDay() {
    return this.converttoTZ().day();
  }

  static getISTDate() {
    return this.converttoTZ().format('YYYY-MM-DD');
  }

  static converttoTZ(dateTime?, format?: string) {
    return dateTime
      ? format
        ? moment.utc(dateTime, format).tz(currentTZ)
        : moment.utc(dateTime).tz(currentTZ)
      : moment.utc().tz(currentTZ);
  }

  // static validateOTPExpirationTime(expiryDate) {
  //   return moment(moment().format()).isAfter(expiryDate);
  // }

  // static getBookingRemainingTime(date, time, before) {
  //   let nextBookingTime = moment(`${date} ${time}`).subtract(before, 'minutes');
  //   let secondsLeft = nextBookingTime.diff(moment(), 'seconds');
  //   let dateObject = moment.duration(secondsLeft, 'seconds');
  //   return {
  //     minutes: parseInt(dateObject.asMinutes().toFixed()) > 0 ? parseInt(dateObject.asMinutes().toFixed()) : 0,
  //     seconds: dateObject.seconds() > 0 ? dateObject.seconds() : 0
  //   };
  // }

  // static getTime24(time) {
  //   return moment(time, 'HH:mm:ss').format('hh:mm A');
  // }
}
