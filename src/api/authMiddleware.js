import  { auth }  from "../config/firebase.js"

async function verifyToken(req, res, next) {
    // const token =  req.body.token;
    const token =  req.headers['authorization'];
    console.log(token, req.body.token)
    if (!token) {
        return res.status(401).send('No token provided.');
    }
    // const bearer = token.substring(7, token.length);
    try {
        console.log('the token', token)
        const decodedToken = await auth.verifyIdToken(token);
        // req.user = decodedToken
        req.body.user = {
            uid: decodedToken.uid
        }
        console.log('the middleware executed with success', req.body.user.uid, decodedToken)
        next();
    } catch (error) {
        res.status(401).send('Invalid token.'); 
    }
}

export default verifyToken;