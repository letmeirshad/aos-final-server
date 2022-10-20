import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  ChangePassword,
  ForgotPassword,
  Profile,
  ProfileEdit,
  AdminDTO,
  DeleteCustomer,
  CustomerRecharge,
  Analytics,
} from './admin.dto';
import * as fromShared from '../shared';
import { Response } from 'express';
import { TransactionManager, EntityManager } from 'typeorm';
import { JwtAuthGuard } from '../authentication/auth.guard';
import { ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { BeforeLoginGuard } from '../shared/guards/before-login.guard';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // @ApiHeader({ name: 'access-token' })
  // @UseGuards(BeforeLoginGuard)
  // @Post('/save')
  // async create(@Body() admin: AdminDTO, @Res() res: Response) {
  //   try {
  //     const adminDetails = await this.adminService.save(admin);
  //     return fromShared.saved(res, adminDetails);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in creating new admin'),
  //     );
  //   }
  // }

  // @UseGuards(JwtAuthGuard)
  // @Roles(fromShared.ROLES.ADMIN)
  // @ApiBearerAuth()
  // @Post('/agent-admin/save')
  // async newagentadmin(
  //   @Body() admin: AdminDTO,
  //   @Res() res: Response,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   try {
  //     const adminDetails = await this.adminService.saveAgent(admin, manager);
  //     return fromShared.saved(res, adminDetails);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in creating new agent admin'),
  //     );
  //   }
  // }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(fromShared.ROLES.ADMIN, fromShared.ROLES.SUPER_ADMIN)
  // @ApiBearerAuth()
  // @Post('/admin/save')
  // async admin(
  //   @Body() admin: AdminDTO,
  //   @Res() res: Response,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   try {
  //     const adminDetails = await this.adminService.saveAdmin(admin, manager);
  //     return fromShared.saved(res, adminDetails);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in creating new admin'),
  //     );
  //   }
  // }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/profile')
  async profile(@Body() profile: Profile, @Res() res: Response) {
    try {
      const profiles = await this.adminService.profile(profile);
      return fromShared.saved(res, profiles);
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in getting profile'),
      );
    }
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(fromShared.ROLES.AGENT_ADMIN)
  // @ApiBearerAuth()
  // @Post('/retailer/save')
  // async retailer(
  //   @Body() admin: AdminDTO,
  //   @Res() res: Response,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   try {
  //     const adminDetails = await this.adminService.saveRetailer(admin, manager);
  //     return fromShared.saved(res, adminDetails);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in creating new retailer'),
  //     );
  //   }
  // }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiBearerAuth()
  // @Roles(
  //   fromShared.ROLES.ADMIN,
  //   fromShared.ROLES.AGENT_ADMIN,
  //   fromShared.ROLES.SUPER_ADMIN,
  // )
  // @Post('/all')
  // async allAdmins(@Res() res: Response, @Body() find: FindAdmin) {
  //   try {
  //     const admins = await this.adminService.findAdmins(find);
  //     return fromShared.found(res, admins);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in finding admins'),
  //     );
  //   }
  // }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiBearerAuth()
  // @Roles(
  //   fromShared.ROLES.ADMIN,
  //   fromShared.ROLES.AGENT_ADMIN,
  //   fromShared.ROLES.SUPER_ADMIN,
  // )
  // @Get()
  // async findAll(@Res() res: Response) {
  //   try {
  //     const admins = classToPlain(await this.adminService.findAll());
  //     return fromShared.found(res, admins);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in finding admins'),
  //     );
  //   }
  // }

  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @Post('/wallet-recharge')
  // async rechargeAdmin(
  //   @Res() res: Response,
  //   @Body() recharge: Recharge,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   try {
  //     const updatedWallet = await this.adminService.rechargeWallet(
  //       recharge,
  //       manager,
  //     );
  //     return fromShared.success(res, 'Recharge Successfull', updatedWallet);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in recharging wallet'),
  //     );
  //   }
  // }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(
  //   fromShared.ROLES.ADMIN,
  //   fromShared.ROLES.AGENT_ADMIN,
  //   fromShared.ROLES.RETAILER,
  // )
  // @ApiBearerAuth()
  // @Post('/points')
  // async getPoints(@Res() res: Response, @Body() points: Points) {
  //   try {
  //     const updatedPoints = await this.adminService.getPoints(points);
  //     return fromShared.success(res, null, updatedPoints);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in getting points'),
  //     );
  //   }
  // }

  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @Post('/payment')
  // async acceptPayment(
  //   @Res() res: Response,
  //   @Body() payment: Payment,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   try {
  //     await this.adminService.acceptPayment(payment, manager);
  //     return fromShared.success(res);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in saving payment'),
  //     );
  //   }
  // }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(fromShared.ROLES.RETAILER)
  // @ApiBearerAuth()
  // @Post('/update-customer')
  // async updateCustomer(@Res() res: Response, @Body() cust: CustomerDTO) {
  //   try {
  //     const admins = classToPlain(
  //       await this.adminService.updateCustomerStatus(cust),
  //     );
  //     return fromShared.success(res, 'Information Updated', admins);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in updating customer'),
  //     );
  //   }
  // }

  @UseGuards(BeforeLoginGuard)
  @ApiHeader({ name: 'access-token' })
  @Post('/change-password')
  async changePassword(
    @Res() res: Response,
    @Body() changePass: ChangePassword,
  ) {
    try {
      await this.adminService.changePassword(changePass);
      return fromShared.success(res, 'Password changed Sucessfull');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in changing password'),
      );
    }
  }

  @ApiHeader({ name: 'access-token' })
  @UseGuards(BeforeLoginGuard)
  @Post('/forgot-password')
  async forgotPassword(
    @Res() res: Response,
    @Body() forgotPass: ForgotPassword,
  ) {
    try {
      await this.adminService.forgotPassword(forgotPass);
      return fromShared.saved(res, 'Password changed Sucessfull');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in changing password'),
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @Roles(
  //   fromShared.ROLES.SUPER_ADMIN,
  //   fromShared.ROLES.ADMIN,
  //   fromShared.ROLES.AGENT_ADMIN,
  // )
  // @ApiBearerAuth()
  // @Post('/reset-admin-password')
  // async resetAdminPassword(@Res() res: Response, @Body() req: ResetPassAdmin) {
  //   try {
  //     const pass = await this.adminService.resetAdminPwd(req);
  //     return fromShared.success(res, 'Password Reset Done', pass);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error while resetting Password'),
  //     );
  //   }
  // }

  // @UseGuards(JwtAuthGuard)
  // @Roles(fromShared.ROLES.RETAILER)
  // @ApiBearerAuth()
  // @Post('/reset-customer-password')
  // async resetCustPassword(@Res() res: Response, @Body() req: ResetPassCust) {
  //   try {
  //     const pass = await this.adminService.resetCustPwd(req);
  //     return fromShared.success(res, 'Password Reset Done', pass);
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error while resetting Password'),
  //     );
  //   }
  // }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/customer-recharge')
  async customerRecharge(
    @Res() res: Response,
    @Body() recharge: CustomerRecharge,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      await this.adminService.rechargeCustomerWallet(recharge, manager);
      return fromShared.success(res, 'Customer recharge successfull');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in recharging customer wallet'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/customer-delete')
  async deleteCustomer(
    @Res() res: Response,
    @Body() del: DeleteCustomer,
    @TransactionManager() manager: EntityManager,
  ) {
    try {
      await this.adminService.deleteCustomer(del, manager);
      return fromShared.success(res, 'Deleted Successfully');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in Deleting'),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  // @Roles(fromShared.ROLES.RETAILER, fromShared.ROLES.ADMIN)
  @ApiBearerAuth()
  @Post('/customer-status')
  async blockCustomer(@Res() res: Response, @Body() del: DeleteCustomer) {
    try {
      await this.adminService.blockCustomer(del);
      return fromShared.success(res, 'Successfully Updated Status');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in updating status'),
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @Roles(fromShared.ROLES.ADMIN, fromShared.ROLES.AGENT_ADMIN)
  // @ApiBearerAuth()
  // @Post('/delete')
  // async deleteAdmin(
  //   @Res() res: Response,
  //   @Body() del: DeleteAdmin,
  //   @TransactionManager() manager: EntityManager,
  // ) {
  //   try {
  //     await this.adminService.deleteAdmin(del, manager);
  //     return fromShared.success(res, 'Deleted Successfully');
  //   } catch (error) {
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in Deleting'),
  //     );
  //   }
  // }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/update-profile')
  async updateProfile(@Res() res: Response, @Body() req: ProfileEdit) {
    try {
      const updatedNames = await this.adminService.updateAdminProfile(req);
      return fromShared.success(
        res,
        'Profile updated successfully',
        updatedNames,
      );
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in updating profile'),
      );
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @Post('/admin-analytics')
  // async getAnalytics(@Res() res: Response, @Body() req: Analytics) {
  //   try {
  //     const updatedNames = await this.adminService.getAnalysis(req);
  //     return fromShared.found(res, updatedNames);
  //   } catch (error) {
  //     console.log(error);
  //     throw new BadRequestException(
  //       fromShared.formatError(error, 'Error in updating profile'),
  //     );
  //   }
  // }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('/clear-data')
  async deleteData(@Res() res: Response) {
    try {
      await this.adminService.deleteData();
      return fromShared.success(res, 'Deleted Successfully');
    } catch (error) {
      throw new BadRequestException(
        fromShared.formatError(error, 'Error in deleting data'),
      );
    }
  }
}
