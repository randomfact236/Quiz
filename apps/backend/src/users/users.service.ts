import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  async create(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      name,
    });
    return this.userRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {throw new NotFoundException('User not found');}
    return user;
  }

  async getAll(): Promise<User[]> {
    return this.userRepo.find({ select: ['id', 'email', 'name', 'role', 'createdAt'] });
  }

  async updateProfile(id: string, data: { name?: string; avatar?: string }): Promise<User> {
    // Only allow updating safe fields (name, avatar) - prevents mass assignment
    const updateData: Partial<User> = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar;
    }
    await this.userRepo.update(id, updateData);
    return this.findById(id);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.userRepo.update(id, { refreshToken: refreshToken as any });
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { refreshToken } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { googleId } });
  }

  async createWithGoogle(email: string, name: string, googleId: string, avatar?: string): Promise<User> {
    const user = this.userRepo.create({
      email,
      name,
      googleId,
      avatar,
      password: '',
    });
    return this.userRepo.save(user);
  }

  async updateGoogleId(userId: string, googleId: string): Promise<void> {
    await this.userRepo.update(userId, { googleId });
  }

  async updateRole(id: string, role: string): Promise<void> {
    await this.userRepo.update(id, { role });
  }

  async updatePasswordResetToken(id: string, token: string, expires: Date): Promise<void> {
    await this.userRepo.update(id, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { passwordResetToken: token },
      select: ['id', 'email', 'name', 'role', 'passwordResetToken', 'passwordResetExpires'],
    });
  }

  async updatePassword(id: string, password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 12);
    await this.userRepo.update(id, { password: hashedPassword });
  }

  async clearPasswordResetToken(id: string): Promise<void> {
    await this.userRepo.update(id, {
      passwordResetToken: null as any,
      passwordResetExpires: null as any,
    });
  }

  async delete(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }

  async updateDemographics(
    id: string,
    data: { country?: string; sex?: 'male' | 'female'; ageGroup?: string },
  ): Promise<User> {
    await this.userRepo.update(id, data);
    return this.findById(id);
  }

  async updateLastActive(id: string): Promise<void> {
    await this.userRepo.update(id, { lastActive: new Date() });
  }

  async getAllWithDemographics(): Promise<User[]> {
    return this.userRepo.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'name', 'role', 'country', 'sex', 'ageGroup', 'createdAt', 'lastActive'],
    });
  }
}