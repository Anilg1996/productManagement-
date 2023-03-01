const express =require('express')
const router=express.Router();
const usercontroller =require('../controllers/usercontroller');
const productcontroller =require('../controllers/productController')
const cartcontroller = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const auth = require('../middleware/auth')

/*-------------------------user end points ---------------------------------*/
router.post('/register',usercontroller.createUser)
router.post('/login',usercontroller.userLogin)
router.get('/user/:userId/profile',auth.authentication ,usercontroller.userget)
router.put('/user/:userId/profile',auth.authentication,auth.authorisation,usercontroller.updateUser)

/*-------------------------Products end points---------------------------------*/
router.post('/products',productcontroller.createProduct)
router.get('/products',productcontroller.getProductbyQuery)
router.get('/products/:productId',productcontroller.getProductById)
router.put('/products/:productId',productcontroller.updateproduct)
router.delete('/products/:productId',productcontroller.deleteProduct)

/*-------------------------cart end points---------------------------------*/
router.post('/users/:userId/cart' , cartcontroller.cartCreate)
router.put('/users/:userId/cart',cartcontroller.updateCart)
router.get('/users/:userId/cart',cartcontroller.getCart )
router.delete('/users/:userId/cart',cartcontroller.deleteCart)

/*-------------------------order end points---------------------------------*/
router.post('/users/:userId/orders' , orderController.createOrder)
router.put('/users/:userId/orders' , orderController.updateorder)

router.all("/**",  (req, res) => {
    return res.status(404).send({ status: false, msg: "Requested path does not exist, Check your URL"})
});
module.exports=router;

