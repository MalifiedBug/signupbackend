import jwt from 'jsonwebtoken'

export const auth = (request,response, next)=>{
    const token = request.header("x-auth-token");
    console.log("token", token)
    jwt.verify(token,process.env.JWT_SECRET)
    next();
}