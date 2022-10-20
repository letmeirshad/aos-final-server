declare global {
  interface String {
    pick(min, max): string;
    shuffle(): string;
  }
}

String.prototype.pick = function(min, max) {
  var n,
    chars = '';

  if (typeof max === 'undefined') {
    n = min;
  } else {
    n = min + Math.floor(Math.random() * (max - min));
  }

  for (var i = 0; i < n; i++) {
    chars += this.charAt(Math.floor(Math.random() * this.length));
  }

  return chars;
};

String.prototype.shuffle = function() {
  var array = this.split('');
  var tmp,
    current,
    top = array.length;

  if (top)
    while (--top) {
      current = Math.floor(Math.random() * (top + 1));
      tmp = array[current];
      array[current] = array[top];
      array[top] = tmp;
    }

  return array.join('');
};

import * as bcrypt from 'bcrypt';
// const specials = '!@#$%^&*()_+{}:"<>?\|[];\',./`~';
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '0123456789';
export class HashingService {
  saltRound = 10;
  constructor() {}

  async getHash(password: string) {
    return bcrypt.hash(password, this.saltRound);
  }

  async compareHash(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  generateRandom() {
    const password = (
      lowercase.pick(2, 2) +
      uppercase.pick(3, 3) +
      numbers.pick(3, 3)
    ).shuffle();
    return password.shuffle();
  }
}
