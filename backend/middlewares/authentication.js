import jwt from 'jsonwebtoken';

export default function authorization(req, res, next){
    const token = req.headers.token;

    if (!token){
        res.send({
            'success': false,
            'message': 'Unauthenticated user',
        })
        return;
    }
    jwt.verify(token, process.env.API_SECRET_KEY, (err, decoded) => {
        if (err){
            res.send({
                'success': false,
                'message': 'Invalid token',
            });
            return;
        } else{
            res.locals.username = decoded?.username;
            res.locals.user_id = decoded?.user_id
            res.locals.authenticated = true;
            next();
        }
    });
}