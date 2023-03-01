const cartModel = require('../Models/cartModel')
const productModel =require('../Models/productsModels')
const usermodel  = require('../Models/usermodel')
const validator = require('../validators/validator')

const cartCreate = async (req, res) => {
    try {
        let requestBody = req.body
        let userId = req.params.userId

        if(!validator.isValidObjectId(userId)){
            return res.status(400).send({status: false, message:"userId is not vaild"})
          }
        
        //    if(userId!=req.userId){
        //     return res.status(400).send({status:false,message:"please provide valid userid"})
        //    }
           const getuser = await usermodel.findOne({_id:userId,isDeleted:false})
           if(!getuser){
           return res.status(400).send({status: false, message:"userId is not register"})
           }

        const { productId, cartId } = requestBody

        if (validator.valid(requestBody)) {
            return res.status(400).send({ status: false, message: "Provide some data inside the body " })
        }

        
        if (cartId) {
            if (!validator.isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Cart Id not valid" })
            }
        }

        if (!validator.valid(productId)) {
            return res.status(400).send({ status: false, message: "productId is required" })
        }
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "product  Id not valid" })
        }

        const CheckProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!CheckProduct) {
            return res.status(404).send({ status: false, message: 'Product Not found' })
        }

        const checkCartPresent = await cartModel.findOne({ userId: userId })

        if (!checkCartPresent) {
            const cartObject = {
                userId: userId,
                items: [{ productId: productId, quantity: 1 }],
                totalPrice: CheckProduct.price,
                totalItems: 1

            }
            const createCart = await cartModel.create(cartObject)
            return res.status(201).send({ status: true, message: "Success", data: createCart })
        }

        if (checkCartPresent) {
            if (checkCartPresent._id.toString() !== cartId) {
                return res.status(404).send({ status: false, message: "user allredy have cartId  please provide cartId" })
            }
        }
        let array = checkCartPresent.items
        for (let i = 0; i < array.length; i++) {
            if (array[i].productId == productId) {
                array[i].quantity = array[i].quantity + 1
                const updateCart = await cartModel.findOneAndUpdate(
                    { userId: userId },
                     { items: array,
                        totalPrice: checkCartPresent.totalPrice + CheckProduct.price
                    }, { new: true }
                )
                return res.status(201).send({ status: true, message: "Success", data: updateCart })
            }
        }

        const cartObject = {
            $addToSet: { items: { productId: productId, quantity: 1 } },
            totalPrice: checkCartPresent.totalPrice + CheckProduct.price,
            totalItems: checkCartPresent.totalItems + 1,
        }

        const cartUpdate = await cartModel.findOneAndUpdate({ userId: userId }, cartObject, { new: true })

        return res.status(201).send({ status: true, message: "Success", data: cartUpdate })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
const updateCart = async function (req, res) {
    try {
        const userId = req.params.userId
        const {cartId, productId, removeProduct} = req.body
        
        if (Object.keys(userId) == 0) {return res.status(400).send({status: false, message: "Please provide user id in path params"})}

        if (!validator.isValidObjectId(userId)) {return res.status(400).send({status: false, message: "Please provide a valid User Id"})}

        if (!validator.valid(cartId)) {return res.status(400).send({status: true, message: "Please provide cart id in body"})}

        if (!validator.isValidObjectId(cartId)) {return res.status(400).send({status: false, message: "Please provide a valid Cart Id"})}

        if (!validator.valid(productId)) {return res.status(400).send({status: true, message: "Please provide cart id in body"})}

        if (!validator.isValidObjectId(productId)) {return res.status(400).send({status: false, message: "Please provide a valid Product Id"})}

        if (!validator.valid(removeProduct)) {return res.status(400).send({status: true, message: "Please provide cart id in body"})}

        
        let cart = await cartModel.findById({ _id: cartId })
        if (!cart) {
            return res.status(404).send({ status: false, msg: "Cart not found" })
        }
        if (cart.totalPrice == 0 && cart.totalItems == 0) {
            return res.status(400).send({ status: false, msg: "Cart is empty" })
        }
        let user = await usermodel.findOne({ _id: userId, isDeleted: false })
        if (!user) {
            return res.status(404).send({ status: false, msg: "User not found" })
        }
        let cartMatch = await cartModel.findOne({userId: userId})
        if (!cartMatch) {
            return res.status(401).send({status: false, message: "This cart doesnot belong to you. Please check the input"})
        }
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, msg: "Product not found" })
        }
        
        if (removeProduct == 0) {
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == productId) {
                    const productPrice = product.price * cart.items[i].quantity
                    const updatePrice = cart.totalPrice - productPrice
                     cart.items.splice(i, 1)
                    const updateItems = cart.totalItems - 1
                    const updateItemsAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice: updatePrice, totalItems: updateItems },{new:true})
                    return res.status(200).send({ status: true, msg: "Succesfully Updated in the cart", data: updateItemsAndPrice })
                }

            }
        } else if (removeProduct == 1){
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == productId) {
                    const updateQuantity = cart.items[i].quantity - 1
                    if (updateQuantity < 1) {
                        const updateItems = cart.totalItems - 1
                        const productPrice = product.price * cart.items[i].quantity
                        const updatePrice = cart.totalPrice - productPrice
                         cart.items.splice(i, 1)
                        
                        const updateItemsAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items: cart.items, totalPrice: updatePrice, totalItems: updateItems },{new:true})
                        return res.status(200).send({ status: true, msg: "Product has been removed successfully from the cart", data: updateItemsAndPrice })

                    } else {
                        cart.items[i].quantity = updateQuantity
                        const updatedPrice = cart.totalPrice - (product.price * 1)
                        const updatedQuantityAndPrice = await cartModel.findOneAndUpdate({ userId: userId }, { items:cart.items,totalPrice: updatedPrice },{new:true})
                        return res.status(200).send({ status: true, msg: "Quantity has been updated successfully in the cart", data: updatedQuantityAndPrice })
                    }
                }
            }
        }

    } catch(error) {
        res.status(500).send({ status: false, msg: error.msg })
    }}


const getCart = async (req, res) => {

    try {

        let userId = req.params.userId;

        let carts = await cartModel.findOne({ userId: userId }).populate('items.productId')
        if (!carts) return res.status(404).send({ status: false, message: "cart does not exist!" })
        return res.status(200).send({ status: true, message: 'Success', data: carts })

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
}
}

const deleteCart = async (req, res) => {

    try {

        let userId = req.params.userId;

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "please enter valid productId" })
        }
        
        let cartDelete = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true })
        if (!cartDelete) return res.status(404).send({ status: false, message: "cart does not exist OR already deleted!" })

        
        return res.status(204).send({status:true,message:"data deleted successfully"})

    } catch (error) {

        return res.status(500).send({ status: false, error: error.message })
    }}


module.exports={cartCreate,updateCart,deleteCart,getCart}