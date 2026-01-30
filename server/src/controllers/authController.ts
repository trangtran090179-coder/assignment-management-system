import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Mock user database (in production, use real database)
const users: any[] = [];

const secretKey = process.env.JWT_SECRET || 'your_secret_key';

export class AuthController {
    async login(req: Request, res: Response) {
        try {
            const { email, password, role } = req.body;
            
            // Find user in mock database
            const user = users.find(u => u.email === email && u.password === password);
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Email hoặc mật khẩu không đúng' 
                });
            }

            // Check role matches
            if (user.role !== role) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Vai trò không phù hợp' 
                });
            }

            // Create JWT token to authenticate requests
            const { password: _, ...userWithoutPassword } = user;
            const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, secretKey, { expiresIn: '7d' });

            res.json({ 
                success: true, 
                message: 'Đăng nhập thành công',
                user: userWithoutPassword,
                token,
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi server' 
            });
        }
    }

    async register(req: Request, res: Response) {
        try {
            const { name, email, password, role, classCode } = req.body;
            
            // Check if user already exists
            const existingUser = users.find(u => u.email === email);
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email đã được sử dụng' 
                });
            }

            // Create new user
            const newUser = {
                id: Date.now(),
                name,
                email,
                password, // In production, hash this password
                role,
                classCode: role === 'student' ? classCode : undefined,
                createdAt: new Date()
            };

            users.push(newUser);

            // Return user data (without password) and token
            const { password: _, ...userWithoutPassword } = newUser;
            const token = jwt.sign({ id: newUser.id, role: newUser.role, email: newUser.email }, secretKey, { expiresIn: '7d' });

            res.status(201).json({ 
                success: true, 
                message: 'Đăng ký thành công',
                user: userWithoutPassword,
                token,
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Lỗi server' 
            });
        }
    }

    async logout(req: Request, res: Response) {
        res.json({ 
            success: true, 
            message: 'Đăng xuất thành công' 
        });
    }

    async getCurrentUser(req: Request, res: Response) {
        // Logic to get the currently logged-in user
        res.json({ 
            success: true, 
            message: 'Get current user' 
        });
    }
}