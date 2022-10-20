export const BAZAARS = {
  MAIN_OPEN: 'MO',
  MAIN_CLOSE: 'MC',
  KALYAN_OPEN: 'KO',
  KALYAN_CLOSE: 'KC',
  TIME_OPEN: 'TO',
  TIME_CLOSE: 'TC',
  MILAN_DAY_OPEN: 'MDO',
  MILAN_DAY_CLOSE: 'MDC',
  MILAN_NIGHT_OPEN: 'MNO',
  MILAN_NIGHT_CLOSE: 'MNC',
};

export const getBazaarInitials = (id: number) => {
  switch (id) {
    case 1:
      return BAZAARS.KALYAN_OPEN;
    case 2:
      return BAZAARS.KALYAN_CLOSE;
    case 3:
      return BAZAARS.MAIN_OPEN;
    case 4:
      return BAZAARS.MAIN_CLOSE;
    case 5:
      return BAZAARS.TIME_OPEN;
    case 6:
      return BAZAARS.TIME_CLOSE;
    case 7:
      return BAZAARS.MILAN_DAY_OPEN;
    case 8:
      return BAZAARS.MILAN_DAY_CLOSE;
    case 9:
      return BAZAARS.MILAN_NIGHT_OPEN;
    case 10:
      return BAZAARS.MILAN_NIGHT_CLOSE;
    default:
      return null;
  }
};

export enum TrxnType {
  TRXN = 'TRXN',
  WALLET = 'WALLET',
}

export enum PaymentStatus {
  FULLY_PAID = 'FULLY_PAID',
  PARTIAL_PAID = 'PARTIAL_PAID',
  NOT_PAID = 'NOT_PAID',
}

export const DEFAULT = {
  PAGINATION: 10,
};

export const GAMES = {
  SINGLE: 1,
  PAANA: 2,
  CP: 3,
  MOTOR: 4,
  BRACKETS: 5,
  CHART: 6,
  COMMON: 7,
};

export const GAMES_CUST = {
  HT: 1,
};

export const getBazaarCombo = (id: number) => {
  let combo1 = getBazaarInitials(id);
  let combo2 = getBazaarInitials(getInverse(id));
  if (combo1 > combo2) {
    return `${combo1}_${combo2}`;
  } else {
    return `${combo2}_${combo1}`;
  }
};

export const isCloseBazaar = (id: number) => {
  return id % 2 === 0;
};

export const isOpenBazaar = (id: number) => {
  return id % 2 !== 0;
};

export const getInverse = (id: number) => {
  if (isCloseBazaar(id)) {
    return id - 1;
  } else {
    return id + 1;
  }
};

export const isStoreRetailer = (id: number, storeRetailes: string) => {
  const retailerId = storeRetailes.split(',');
  const filteredIds = retailerId.filter(e => +e == id);
  if (filteredIds.length) {
    return true;
  }
  return false;
};
