import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Permissions('product:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.productsService.list(user.organizationId);
  }

  @Get(':id')
  @Permissions('product:read')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.findOne(id, user.organizationId);
  }

  @Post()
  @Permissions('product:create')
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.create(user.organizationId, dto, user);
  }

  @Put(':id')
  @Permissions('product:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productsService.update(id, user.organizationId, dto, user);
  }

  @Delete(':id')
  @Permissions('product:delete')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.delete(id, user.organizationId, user);
  }
}
