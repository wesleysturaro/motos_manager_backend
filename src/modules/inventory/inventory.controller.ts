import { Controller, Get, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  @Roles('admin', 'viewer')
  summary() {
    return this.inventoryService.getSummary();
  }

  @Get('missing')
  @Roles('admin', 'viewer')
  missing() {
    return this.inventoryService.findWithMissingData();
  }
}
