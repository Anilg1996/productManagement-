const productModel = require('../Models/productsModels')
const validator = require('../validators/validator')
const aws =require('./aws')


//__________________________________________________________________________________________________________________________
                                                   //| createProduct |
//__________________________________________________________________________________________________________________________ 

const createProduct =async (req,res)=>{
     
    try{
   const data=req.body;
   let productImage = req.files
   const {title,description,price,availableSizes,currencyId}  = data
    
   /*------------------------- validation ---------------------------------*/
   if(Object.keys(data).length==0){
    
    return res.status(400).send({status:false,message:"Please provide body"})
 }
     if(!validator.valid(title)){
        return res.status(400).send({status:false,message:"Please provide title"})
     }
     const checktitle= await productModel.findOne({title:title})
     if(checktitle){
        return res.status(400).send({status:false,message:"Please provide unquie title"})
     }
     if(!validator.valid(description)){
        return res.status(400).send({status:false,message:"Please provide description"})
     }
     if(!validator.valid(price)){
        return res.status(400).send({status:false,message:"Please provide price"})
     }
     if(!validator.valid(currencyId)){
        return res.status(400).send({status:false,message:"Please provide currency or It should be in valid format"})
     }
     if(!["S", "XS","M","X", "L","XXL", "XL"].includes(availableSizes)){
        return res.status(400).send({status:false,message:"Please provide availableSizes type bleow" ,likethis:["S", "XS","M","X", "L","XXL", "XL"]})
     }
     
     if(productImage.length==0){
        return res.status(400).send({status:false,message:"Please provide productImage"})

     }
     if(productImage && productImage.length > 0){
        if(!(validator.validImageUrl(productImage[0].originalname))) { return res.status(400).send({ status: false, message: "Please provide valid Image file"})}}
     /*-------------------------create url ---------------------------------*/
     const uploadedFileURL = await aws.uploadFile(productImage[0])
     
     data.productImage=uploadedFileURL;

     /*-------------------------create product ---------------------------------*/

     const createProduct = await productModel.create(data)
     return res.status(201).send({status:true,message : "Success",data:createProduct})
    }
    catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}
 //__________________________________________________________________________________________________________________________
                                                   //| getProductByQuery |
//__________________________________________________________________________________________________________________________ 
 
const getProductbyQuery = async (req, res) => {
    try {
        let data = req.query
        let filter = { isDeleted: false }

        if (data.size || data.size == "") {
            if (!validator.valid(data.size)) {
                return res.status(400).send({ status: false, message: "Enter some value in product size" })
            }
        }

        if (data.size) {
            let sizes = data.size.toUpperCase().split(",")
            let enumSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            for (let i = 0; i < sizes.length; i++) {
                if (!enumSize.includes(sizes[i])) {
                    return res.status(400).send({ status: false, message: `Sizes should be ${enumSize} value (with multiple value please give saperated by comma)` })
                }
            }
            filter.availableSizes = {}
            filter.availableSizes["$in"] = sizes
        }


        if (data.name || data.name == "") {
            if (!validator.isValid1(data.name)) {
                return res.status(400).send({ status: false, message: "Enter some value in product name" })
            }

            filter.title = {}
            filter.title["$regex"] = data.name
            filter.title["$options"] = "i"
        }

        if (data.priceGreaterThan === "" || data.priceLessThan === "") {
            return res.status(400).send({ status: false, message: "Price cant be empty" })
        }

        if (data.priceGreaterThan || data.priceLessThan) {
            if (data.priceGreaterThan) {
                if (!validator.isValidPrice(data.priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "priceGreaterThan should be Number " })
                }
            }

            if (data.priceLessThan) {
                if (!validator.isValidPrice(data.priceLessThan)) {
                    return res.status(400).send({ status: false, message: "priceLessThan should be Number " })
                }
            }

            filter.price = {}
            if (data.priceGreaterThan && data.priceLessThan) {
                filter.price["$gt"] = data.priceGreaterThan
                filter.price["$lt"] = data.priceLessThan
            } else {
                if (data.priceGreaterThan) filter.price["$gt"] = data.priceGreaterThan
                if (data.priceLessThan) filter.price["$lt"] = data.priceLessThan
            }
        }

        if (data.priceSort || data.priceSort == "") {
            if (!data.priceSort.match(/^(1|-1)$/)){
                return res.status(400).send({ status: false, message: "priceSort must be 1 or -1" })
            }
        }

        const getProduct = await productModel.find(filter).sort({ price: data.priceSort }) 

        if (!getProduct.length) {
            return res.status(404).send({ status: false, message: "Product not found" })
        }

        return res.status(200).send({ status: true, message: "Success", data: getProduct })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
 //__________________________________________________________________________________________________________________________
                                                   //| getProductbyID |
//__________________________________________________________________________________________________________________________ 
 const getProductById = async function (req, res) {

    try {
         let productId = req.params.productId
         if (!validator.isValidObjectId(productId)) {
             return res.status(400).send({ status: false, message: "please enter valid productId" })
         }
         let product = await productModel.findOne({ _id: productId, isDeleted: false })
 
         if (!product) {
             return res.status(404).send({ status: false, message: "Product not found" })
         }
         res.status(200).send({ status: true, message: 'Success', data: product })
     }
     catch (err) {
         res.status(500).send({ status: false, message: err.message })
     }}


//__________________________________________________________________________________________________________________________
                                                   //| updateProduct |
//__________________________________________________________________________________________________________________________ 
const updateproduct = async (req,res)=>{

    try{
   const data=req.body
   const productid = req.params.productId
   const profileimage = req.files
   const {description,price} = data
   const obj={}

   /*-------------------------productid validation ---------------------------------*/
    if(!productid){
        return res.status(400).send({status:false,message:"please provide productid"})
    }
    if(!validator.isValidObjectId(productid)){
        return res.status(400).send({status:false,message:"please provide correct productid"})
    }
    const checkproductid = await productModel.findById({_id:productid,isDeleted:false})

    if(!checkproductid){
        return res.status(400).send({status:false,message:"please provide register productid"})
    }
    
    /*-------------------------body validation ---------------------------------*/

        if(Object.keys(body).length==0 && productImage.length==0){
            return res.status(400).send({status:false,message:"Please provide body"})
         }

      if(title){
    if(!validator.valid(title)){
        return res.status(400).send({status:false,message:"Please provide title"})
     } data.title=title
    }

        if(description){
     if(!validator.valid(description)){
        return res.status(400).send({status:false,message:"Please provide description"})
     } data.description=description
    }
        if(price){
     if(!validator.valid(price)){
        return res.status(400).send({status:false,message:"Please provide description"})
     }data.price=price
    }
     if (body.currencyId){
        if (!(validator.valid(body.currencyId))) {
            return res.status(400).send({status: false, message: "Please provide Currency Id to update"})}
            if (body.currencyId.trim() !== "INR") {
                return res.status(400).send({ status: false, message: "Please provide Indian Currency Id" })
            }
            data.currencyId = body.currencyId
        }

        if (body.currencyFormat){
        if (!(validator.valid(body.currencyFormat))) {
            return res.status(400).send({status: false, message: "Please provide Currency Format to update"})}
            if (body.currencyFormat.trim() !== "₹") {
                return res.status(400).send({ status: false, message: "Please provide right format for currency" })
            }
            data.currencyFormat = body.currencyFormat
        }
         
        if (body.availableSizes){
            if (!(validator.valid(body.availableSizes))) {
                return res.status(400).send({status: false, message: "Please provide available size to update"})}
    
                if (!(validator.isValidAvailableSizes(body.availableSizes))) {
                    return res.status(400).send({ status: false, message: "Please provide a valid size" })
                }
                
                data.availableSizes = body.availableSizes
    
            }
    
            if (body.installments != null){
            if (!(validator.valid(body.installments))) {
                return res.status(400).send({ status: false, message: "Please provide installment to update" })
                }
                data.installments = body.installments
            }

     if(productImage.length > 0){
        const uploadedFileURL = await aws.uploadFile(productImage[0])
        data.productImage=uploadedFileURL;
     }
     const   updateproduct = await productModel.findOneAndUpdate({_id:productid},data,{new:true})
     return res.status(200).send({status:true,data:updateproduct})
    }
    catch(err){
        return res.status(500).send({status:false,message:err.message})
    }

}
//__________________________________________________________________________________________________________________________
                                                   //| deleteProduct |
//__________________________________________________________________________________________________________________________ 

const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "please enter valid productId" })
        }

        let product = await productModel.findById(productId)

        if (!product) {
            return res.status(404).send({ status: false, message: "Product not found" })
        }
        else {
            if (product.isDeleted == true)
                return res.status(404).send({ status: false, message: "Product Already deleted" })
        }
        await productModel.findByIdAndUpdate({_id:productId}, { $set: { isDeleted: true, deletedAt: new Date() } })
        res.status(200).send({ status: true, message: "Product Deleted Successfully" })
    }catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }}

module.exports={createProduct,updateproduct,deleteProduct,getProductById,getProductbyQuery}