import jwt from 'jsonwebtoken';
import User from '../../models/user.js';

class AccountController{
    constructor() {
        this.user = new User();
    }

    async create(req, res) {
        const { username, email, password, gender } = req.body || {};
    
        try {
            const response = await this.user.create(username, email, password, gender, null);
    
            res.send({
                success: true,
                data: {
                    recordIndex: response?.insertId,
                },
            });
        } catch (err) {
            
            res.send({
                success: false,
                message: err.message === 'username' || err.message === 'email' ? err.message : 'Failed to create account',
            });
        }
    }

    async login(req, res){
        try{
            const { username, password } = req.body || {}

            const result = await this.user.verify(username,  password);

            console.log(result)

            if(!result?.user_id){
                return res.send({
                    success: false,
                    message: 'Invalid username or password',
                })
            } else {
                res.send({
                    success: true,
                    data: {
                        token: jwt.sign({ 'username': username, 'user_id': result?.user_id }, process.env.API_SECRET_KEY, {
                            expiresIn: '1d',
                        })
                    }
                })
            }
        } catch (err){
            res.send({
                success: false,
                message: err.toString(),
            })
        }
    }

    async profile(req, res){
        try{
            const userInfo = await this.user.getUser(res.locals.username);

            res.send({
                success: true,
                data: {
                    id: res.locals.user_id,
                    username: res.locals.username,
                    email: userInfo?.email,
                    profile_img: userInfo?.profile_image,
                }
            })
        } catch (err){
            res.send({
                success: false,
                message: err.toString(),
            });
        }
    }

    async getUsersProfile(req, res){
        try{
            const { userId } = req.params;
            const loginUser = res.locals.user_id;

            if (parseInt(userId, 10) === parseInt(loginUser, 10)){
                return res.send({
                    success: true,
                    redirectToProfile: true,
                })
            }

            const userInfo = await this.user.getSpecificUserAccount(userId,loginUser);

            res.send({
                success: true,
                data: {
                    id: userInfo?.user_id,
                    username: userInfo?.username,
                    bio: userInfo?.bio,
                    email: userInfo?.email,
                    fullname: userInfo?.fullname,
                    is_following: userInfo?.is_following,
                    profile_img: userInfo?.profile_image,
                    created_at: userInfo?.created_at
                }
            })
        } catch (err){
            res.send({
                success: false,
                message: err.toString(),
            });
        }
    }

    
    
}



export default AccountController;