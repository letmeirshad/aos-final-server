import { HttpService, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExternalService {
  constructor(private httpService: HttpService) {}

  sendSms(mobile, otp) {
    // let options = {
    //   method: 'GET',
    //   hostname: 'api.msg91.com',
    //   port: null,
    //   path: `/api/v5/otp?template_id=&mobile=${mobile}&authkey=&otp=${otp}`,
    //   headers: {
    //     'content-type': 'application/json',
    //   },
    // };

    this.httpService
      .get(
        `http://api.msg91.com/api/v5/otp?template_id=&mobile=${mobile}&authkey=&otp=${otp}`,
      )
      .subscribe(res => {});
  }

  async paymentAuthenticate() {
    const res = await this.httpService
      .get(
        `http://bigboss247.com/api/pinnaclematka?${process.env.PAYMENT_AUTH_KEY}/json=1`,
      )
      .toPromise();

    // console.log(res);
    if (res.data[0].ERROR) {
    }
    if (res.status === 200) {
      return res.data[0].key;
    }
    return null;
  }

  async generateBill(key, amount, mobile, name, custId) {
    if (amount < 10) {
      amount = Number(0 + `${amount}`);
    }
    const res = await this.httpService
      .get(
        `http://bigboss247.com/api/${key}/pgRoute/genbill/amount=${amount}00/name=${name}/email=customer@pinnaclematka.com/mobile=${mobile}/account=CLIENT1/tpid=${custId}/json=1`,
      )
      .toPromise();
    console.log(res);
    Logger.error(JSON.stringify(res.data));
    if (res.status === 200) {
      if (res.data[0].ERROR && res.data[0].ERROR == 'Invalid Key.') {
        return 'ERROR';
      }
      return res.data[0].billid;
    }
    return null;
  }

  paymentStatus(key, billId) {
    return this.httpService
      .get(
        `http://bigboss247.com/api/${key}/pgRoute/paystatus/billid=${billId}/json=1`,
      )
      .toPromise();
  }
}
