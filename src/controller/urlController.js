const urlModel = require('../model/urlModel')
const validUrl = require('valid-url')
const shortid = require('shortid')
const redis = require('redis')
const {promisify} = require('util')




const redisClient = redis.createClient(
    14169,
    "redis-14169.c16.us-east-1-2.ec2.cloud.redislabs.com",

    { no_ready_check: true }
);
redisClient.auth("XpjNU5wqWNRfxsvtC18K9eXU43xR0FZb", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});


//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


// validation checking function


const isValid = function (value) {
    if (typeof value === 'undefinde' || value === 'null') return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}
const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}



//post/url/shorten


const urlShortner = async function (req, res) {


    try {

        let data = req.body
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, msg: "pls provide detils" })
        }
        else {
            let longUrl = req.body.longUrl
            if (!longUrl) {
                return res.status(400).send({ status: false, msg: 'pls proide long url' })
            }
            if (!validUrl.isUri(longUrl)) {
                return res.status(400).send({ status: false, msg: "pls provide valid long url link" })

            }

            let cachedlinkdata = await GET_ASYNC(`${req.body.longUrl}`)
            if (cachedlinkdata) {
                let change = JSON.parse(cachedlinkdata)
                return res.status(200).send({ status: true, redisdata: change })
            }

            let find = await urlModel.findOne({ longUrl: longUrl }).select({ createdAt: 0, updateAt: 0, __v: 0, _id: 0 })
            if (find) {
                await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify(find))
                return res.status(200).send({ status: true, msg: "you should be lokking for this", mongodata: find })
            }
            else {
                const baseUrl = 'http://localhost:3000'
                let urlCode = shortid.generate().toLowerCase()
                let shortUrl = baseUrl + '/' + urlCode
                let urls = { longUrl, shortUrl, urlCode }
                await urlModel.create(urls)

                let createdUrl = await urlModel.findOne({ urlCode: urlCode }).select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0 })
                await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(createdUrl))
                res.status(201).send({ status: true, data: createdUrl })


            }

        }
    }
        catch (error) {
            return res.status(500).send({
                status: false,
                message: "Something went wrong",
                error: error.message
            })
        }
    
}


//GET /:urlCode

const geturl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode
        if (!isValid(urlCode)) {
            return res.status(400).send({ status: false, messege: "Please Use A Valid Link" })
        } else {
            let cacheddata = await GET_ASYNC(`${req.params.urlCode}`)
            if(cacheddata){
              let changetype = JSON.parse(cacheddata)
              return  res.status(302).redirect(changetype.longUrl);
            }
            let findUrl = await urlModel.findOne({ urlCode: urlCode })
            if (findUrl) {
            await SET_ASYNC(`${req.params.urlCode}`,JSON.stringify(findUrl),"EX",20);
            return res.status(302).redirect(findUrl.longUrl);
                
            }else{
                return res.status(404).send({ status: false, messege: "Cant Find What You Are Looking For" })
            }
        }

    } catch (error) {
        return res.status(500).send({
            status: false,
            message: "Something went wrong",
            error: error.message
        })
    }
}

module.exports.urlShortner = urlShortner
module.exports.geturl = geturl