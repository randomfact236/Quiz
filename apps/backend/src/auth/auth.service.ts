import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }
    
    const user = await this.usersService.create(email, password, name);
    const token = this.jwtService.sign({ id: user.id, email: user.email, role: user.role });
    
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const isValid = await this.usersService.validatePassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const token = this.jwtService.sign({ id: user.id, email: user.email, role: user.role });
    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }

  async validateUser(id: string) {
    return this.usersService.findById(id);
  }
}