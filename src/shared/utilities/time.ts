import * as moment from 'moment-timezone';
import { interval } from 'rxjs';
import { Configuration } from './configuration';

const currentTZ = 'Asia/Calcutta';
moment.tz.setDefault(currentTZ);

export class Time {
  /**
   * Checked
   */
  static getOTPExpirationTime() {
    return moment()
      .add(Configuration.OTP_EXPIRY_TIME, 'm')
      .format();
  }

  /**
   * Checked
   */
  static getCurrentDate() {
    return moment().format('YYYY-MM-DD');
  }

  static getNextDate() {
    return moment()
      .add(1, 'day')
      .format('YYYY-MM-DD');
  }

  static getCurrentDateStatus(date) {
    return (
      Time.getCurrentDate() === date ||
      moment().isBefore(moment(date, 'YYYY-MM-DD'))
    );
  }

  static getPreviousDate() {
    return moment()
      .subtract(1, 'day')
      .format('YYYY-MM-DD');
  }

  /**
   * Checked
   */
  static validateOTPExpirationTime(expiryDate) {
    return moment().isAfter(expiryDate);
  }

  /**
   * Checked
   */
  static isMidNight(time?: string): boolean {
    const checkTime = time ? time : moment().format('HH:mm');
    if (
      moment(checkTime, 'HH:mm').isBetween(
        moment('00:00', 'HH:mm'),
        moment('06:00', 'HH:mm'),
        null,
        '[]',
      )
    ) {
      return true;
    } else {
      return false;
    }
  }

  static getBookingRemainingTime(date, time, before) {
    let currentBooking;
    if (!date) {
      return 0;
    }

    if (this.isMidNight(time)) {
      currentBooking = moment(`${date} ${time}`).add(1, 'd');
    } else {
      currentBooking = moment(`${date} ${time}`);
    }
    const nextBookingTime = currentBooking.clone().subtract(before, 'minutes');
    const secondsLeft = moment(
      nextBookingTime.format('YYYY-MM-DD HH:mm:ss'),
      'YYYY-MM-DD HH:mm:ss',
    ).diff(
      moment(moment().format('YYYY-MM-DD HH:mm:ss'), 'YYYY-MM-DD HH:mm:ss'),
      'seconds',
    );
    if (secondsLeft < 0) {
      return 0;
    }

    return secondsLeft;
  }

  // static isBookingAnotherDay(gameTime, closeBefore) {
  //   gameTime = moment(gameTime, 'HH:mm').subtract(closeBefore, 'minutes').format('HH:mm');
  //   if (moment().isBetween(moment('00:00', 'HH:mm'), moment(gameTime, 'HH:mm'), null, '[]')) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  static daysBack(day, date?) {
    if (date) {
      return moment(date, 'YYYY-MM-DD')
        .subtract(day, 'day')
        .format('YYYY-MM-DD');
    }
    return moment()
      .subtract(day, 'day')
      .format('YYYY-MM-DD');
  }

  static nextDay(date) {
    return moment(date, 'YYYY-MM-DD')
      .add(1, 'day')
      .format('YYYY-MM-DD');
  }

  static isBefore(date, before) {
    return moment(before, 'YYYY-MM-DD').isAfter(moment(date, 'YYYY-MM-DD'));
  }

  static getTime24(time) {
    return moment(time, 'HH:mm:ss').format('hh:mm A');
  }

  static getTime() {
    return moment().format('HH:mm');
  }

  static getResultEnterTiming(date, time) {
    let currentBooking;
    if (!date) {
      return 0;
    }

    if (this.isMidNight(time)) {
      currentBooking = moment(`${date} ${time}`).add(1, 'd');
    } else {
      currentBooking = moment(`${date} ${time}`);
    }
    const secondsLeft = moment(
      currentBooking.format('YYYY-MM-DD HH:mm:ss'),
      'YYYY-MM-DD HH:mm:ss',
    ).diff(
      moment(moment().format('YYYY-MM-DD HH:mm:ss'), 'YYYY-MM-DD HH:mm:ss'),
      'seconds',
    );
    if (secondsLeft < 0) {
      return 0;
    }

    return secondsLeft;
  }

  static format(date) {
    return moment(date).format('YYYY-MM-DD');
  }

  static formatDateString(time) {
    return moment(time).format('DD-MM-YYYY h:mm A');
  }

  static dateFormatter(date) {
    return moment(date, 'YYYY-MM-DD').format('DD-MM-YYYY');
  }

  static compareTime(t1, t2) {
    let mt1 = moment(t1, 'HH:mm:ss');
    let mt2 = moment(t2, 'HH:mm:ss');
    return mt1.diff(mt2);
  }

  static sortBazaar(bazaarList) {
    let mb = [];
    let ob = [];
    let startTiming = moment('00:00:00', 'HH:mm:ss');
    let endTiming = moment('01:00:00', 'HH:mm:ss');

    bazaarList.forEach(element => {
      const timing = moment(element.timing, 'HH:mm:ss');
      if (timing.isBetween(startTiming, endTiming, undefined, '[)')) {
        mb.push(element);
      } else {
        ob.push(element);
      }
    });

    return ob.concat(mb);
  }

  static isPreviousMonth(date) {
    let previousMonthEndDate = moment().date(0);
    let previousMonthStartDate = moment()
      .subtract(1, 'months')
      .date(1);
    let currentDate = moment(date, 'YYYY-MM-DD HH:mm:ss');

    if (
      currentDate.isBetween(
        previousMonthStartDate,
        previousMonthEndDate,
        undefined,
        '[]',
      )
    ) {
      return true;
    }

    return false;
  }

  static isCurrentMonth(date) {
    let previousMonthEndDate = moment().endOf('month');
    let previousMonthStartDate = moment().startOf('month');
    let currentDate = moment(date, 'YYYY-MM-DD HH:mm:ss');

    if (
      currentDate.isBetween(
        previousMonthStartDate,
        previousMonthEndDate,
        undefined,
        '[]',
      )
    ) {
      return true;
    }

    return false;
  }

  static addSeconds(time, seconds) {
    return moment(time, 'HH:mm:ss')
      .add(seconds, 'seconds')
      .format('HH:mm:ss');
  }

  static calculateHTSlot(startTime, endTime, interval, closeBefore) {
    let mStart = moment(startTime, 'HH:mm:ss');
    let mEnd = moment(endTime, 'HH:mm:ss').add(1, 'minutes');
    let diff = mEnd.diff(mStart, 'minutes');

    if (diff <= 0) {
      return [];
    }
    if (diff > 1 && diff % interval !== 0) {
      return [];
    }
    const slotNumbers = diff / interval;
    const timings = [];

    for (let i = 0; i < slotNumbers; i++) {
      timings.push({
        startTiming: moment(startTime, 'HH:mm:ss')
          .add(i * interval, 'minutes')
          .format('HH:mm:ss'),
        endTiming: moment(startTime, 'HH:mm:ss')
          .add((i + 1) * interval, 'minutes')
          .subtract(closeBefore, 'seconds')
          .format('HH:mm:ss'),
      });
    }

    return timings;
  }

  static isHTRemainingTime(startTime, endTime) {
    let mStart = moment(startTime + ':00', 'HH:mm:ss');
    let current = moment(moment().format('HH:mm:ss'), 'HH:mm:ss');
    let mEnd = moment(endTime + ':00', 'HH:mm:ss');
    let diff = current.isBetween(mStart, mEnd, undefined, '[]');

    return diff;
  }

  static getCRONTiming(startTime, endTime, interval, closeBefore) {
    let mStart = moment(startTime, 'HH:mm:ss')
      .add(interval, 'minute')
      .subtract(closeBefore, 'seconds');
    let mEnd = moment(endTime, 'HH:mm:ss');
    return {
      startMinute: mStart.minute() ? mStart.minute() : '*',
      startSecond: mStart.seconds(),
      startHour: mStart.hours(),
      interval: interval,
      endHour: mEnd.hours(),
    };
  }

  static calcHTRemainingTime(endTime) {
    let mStart = moment(endTime, 'HH:mm:ss');
    let mEnd = moment(moment().format('HH:mm:ss'), 'HH:mm:ss');
    let diff = mStart.diff(mEnd, 'seconds');

    return diff;
  }

  static getCurrentSlot(slots, interval) {
    const currentSlot = slots.filter(e => {
      let current = moment(moment().format('HH:mm:ss'), 'HH:mm:ss');
      let sStart = moment(e.slot_start_timing, 'HH:mm:ss');
      let sEnd = moment(e.slot_end_timing, 'HH:mm:ss').add(interval, 'seconds');

      if (current.isBetween(sStart, sEnd, undefined, '[]')) {
        return e;
      }
    });

    if (currentSlot.length) {
      return currentSlot[0];
    }
  }

  static getCancellationTime() {
    const currentTime = moment();
    const time1 = [
      moment().hour(9),
      moment()
        .hour(8)
        .minutes(45),
    ];
    const time2 = [
      moment().hour(18),
      moment()
        .hour(17)
        .minutes(45),
    ];

    if (
      currentTime.isBetween(time1[1], time1[0]) ||
      currentTime.isBetween(time1[1], time1[0])
    ) {
      return true;
    } else {
      return false;
    }
  }

  static checkBonusEligibility(bonuses: Array<any>) {
    if (bonuses) {
      if (!bonuses.length) {
        return true;
      }

      let filtered = bonuses
        .map(e => e.created_at)
        .filter(date => this.isCurrentMonth(date));

      if (filtered.length) {
        return false;
      }

      return true;
    }
  }
}
