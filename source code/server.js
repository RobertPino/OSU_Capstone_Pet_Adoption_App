const express = require('express');
const app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
const url = require('url');
const querystring = require('querystring');
const https = require('https');
const axios = require('axios');
const {Datastore} = require('@google-cloud/datastore');
const GCLOUD_PROJECT = 'tgp-pet-cs467';
const GCS_KEYFILE = './tgp-pet-cs467-b67278d4356e.json'
const datastore = new Datastore({
    projectID: GCLOUD_PROJECT
});
const path = require("path");

// Instructions for uploading found here https://www.youtube.com/watch?v=pGSzMfKBV9Q
// Ben Awad - How to upload a File to Google Cloud Storage in Node.js
const {Storage} = require('@google-cloud/storage');
const storage = new Storage({
    keyFilename: path.join(__dirname, GCS_KEYFILE),
    projectId: GCLOUD_PROJECT
});
// const GCS_BUCKET = storage.bucket('tgp-pet-cs467.appspot.com');
const GCS_BUCKET =  "tgp-pet-cs467.appspot.com";

var multer = require("multer");
var multerGoogleStorage = require("multer-google-storage");
const uploadHandler = multer({
    storage: multerGoogleStorage.storageEngine({
        bucket: GCS_BUCKET,
        projectId: GCLOUD_PROJECT,
        keyFilename: GCS_KEYFILE
    })
});

// storage.getBuckets().then(x => console.log(x));

const PETS = "pets";
const USERS = "users";
const ADOPT = "adopt";

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

var jwt_decode = require('jwt-decode');

const bodyParser = require('body-parser');
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true}));

const client_id = '113184584603-u14ob4lgaf85mvv7a2fvl5ar0h3oicus.apps.googleusercontent.com';
const client_secret = 'JhYEkQUnbStmlyXDRdQR5B-b';

// const redirect_uri = 'https://graebelk-cs493-portfolio.uc.r.appspot.com/info';
// const redirect_uri = 'http://localhost:8080/info';

const {OAuth2Client} = require('google-auth-library');
const { getMaxListeners } = require('process');
const client = new OAuth2Client(client_id);

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

/* ------------- Begin  Model Functions ------------- */

// Function to CREATE a new pet to the database
// new_pet is a JSON object with required fields populated as follows
// name, description, and status are free entry strings
// type, breed, and available are strings, but constrained to certain values
// dispAnimals, dispChildren, and dispLeash are boolean
// pic is a string url of the picture location.  This function does not handle the uploading of the picture
function create_pet(new_pet) {
    var key = datastore.key(PETS);

    // Set value of statusDate based on current date
    var today = new Date();
    new_pet['statusDate'] = today;
    new_pet['status'] = "Available";

	return datastore.save({"key": key, "data": new_pet}).then(() => {return key});
}

// Function to READ pets from a database
// Can be passed optional filters in JSON format that match fields in database
function read_pets(filters) {

    let q = datastore.createQuery(PETS);

    // Add filters passed by the url
    for (var key in filters) {
        // Dynamically convert boolean values
        if (filters[key] == 'on') {
            filters[key] = true;
        }
        // if (filters[key] == 'false') {
        //     filters[key] = false;
        // }

        q = q.filter(key, '=', filters[key])
    }
    
    return datastore.runQuery(q).then( (entities) => {
        return entities[0].map(fromDatastore);
    })

}

// READ details of individual pet
function read_pet(id) {
    const q = datastore.createQuery(PETS).filter('__key__', '=', datastore.key([PETS, parseInt(id)]));   
	return datastore.runQuery(q).then( (entities) => {     
            return entities[0].map(fromDatastore);
		});
}

// Change the status of pet to "pending adoption"
function adopt_pet(id, adopt_form) {
    var key = datastore.key([PETS, parseInt(id)]);
    return read_pet(id).then( (pet) =>{
        updated_pet = {
            "birthday": pet[0].birthday,
            "breed": pet[0].breed,
            "description": pet[0].description,
            "dispDogs": pet[0].dispDogs,
            "type": pet[0].type,
            "petName": pet[0].petName,
            "statusDate": pet[0].statusDate,
            "dispKids": pet[0].dispKids,
            "dispHouse": pet[0].dispHouse,
            "dispCats": pet[0].dispCats,
            "pic": pet[0].pic,
            "dispLeash": pet[0].dispLeash,
            "status": "Pending Adoption"
        }
        return datastore.update({"key":key, "data":updated_pet}).then(() => {
            var key = datastore.key(ADOPT);
            datastore.save({"key": key, "data": adopt_form}).then(() => {
                return key;
            })
        }); 
    })
}

// Create a log of the adoption request


// Function to CREATE a new user to the database
function create_user(new_user) {
    var key = datastore.key(USERS);

    // Set value of statusDate based on current date
    var today = new Date();
    new_user['registerDate'] = today;

	return datastore.save({"key": key, "data": new_user}).then(() => {return key});
}

// Function to READ users from a database
function read_users() {
    let q = datastore.createQuery(USERS);
   
    return datastore.runQuery(q).then( (entities) => {
        return entities[0].map(fromDatastore);
    })

}

// Return TRUE if the user is listed as an administrator, and false if not
function check_admin(id) {
    const q = datastore.createQuery(USERS).filter('sub', '=', id);   
	return datastore.runQuery(q).then( (entities) => {
        if(entities[0].length == 0 || entities[0][0]['admin'] == false) {
            return false;
        } else {
            return true;
        }
	});
}

// Function to READ pending adoptions from a database
async function read_pending() {
    let q = datastore.createQuery(ADOPT);
   
    return datastore.runQuery(q).then( async (entities) => {
        // Pull information about pets from pet database
        for (var item in entities[0]) {
            var pet = await read_pet(entities[0][item]['petID']);
            // Add pet information
            entities[0][item]['petName'] = pet[0]['petName'];
            entities[0][item]['pic'] = pet[0]['pic'];
        }
        return entities[0];
    })

}

// Reference mailjet.com 
//This function customizes the content of an email to be used to send to subscribed users 

function newEmail(campID, new_pet){
    const mailjet = require ('node-mailjet')
    .connect('9dbbe33c1a4b07ca9aeaa6ae5d366127', '7c5f340ccb4c06a5d3e31c4d6d90ac71')
    const request = mailjet
    .post("campaigndraft", {'version': 'v3'})
    .id(campID)
    .action("detailcontent")
    .request({
        "Headers":"object",
        "Html-part":"<h2> A new Pet has been added to our database! </h2> </br> <a href=\"https://tgp-pet-cs467.uc.r.appspot.com/profile/" + new_pet.id + "\"><img style=\" max-width: 200px;\" src = " +new_pet.pic + "> </a> <h3> Pet Name:" +" " + new_pet.petName + " </h3> <p> Pet Type: " + new_pet.type + " </p> </p> Pet Breed: " + new_pet.breed + " </p> <p> More Details: " + new_pet.description + " </p> </br> <a href= \"https://tgp-pet-cs467.uc.r.appspot.com\"> Visit Us! </a>",
        "MJMLContent":"",
        "Text-part":"",
    })
    request
    .then((result) => {
        console.log(result.body)
        sendEmail(campID)
    })
    .catch((err) => {
        console.log(err.statusCode)
    })
}

//This function triggers the email to be send to the predetermined distribution list 
function sendEmail(campID){
    const mailjet = require ('node-mailjet')
    .connect('9dbbe33c1a4b07ca9aeaa6ae5d366127', '7c5f340ccb4c06a5d3e31c4d6d90ac71')
const request = mailjet
    .post("campaigndraft", {'version': 'v3'})
    .id(campID)
    .action("send")
    .request()
request
    .then((result) => {
        console.log(result.body)
    })
    .catch((err) => {
        console.log(err.statusCode)
    })
 }
//This function customizes the content of an email to be used to send to subscribed users 
function createCampaign(new_pet){
    const mailjet = require ('node-mailjet')
    .connect('9dbbe33c1a4b07ca9aeaa6ae5d366127', '7c5f340ccb4c06a5d3e31c4d6d90ac71')
    const request = mailjet
    .post("campaigndraft" , {'version': 'v3'})
    .request({
        "Locale":"en_US",
        "EditMode": "html2",
        "Sender":"PetMatch Team",
        "SenderName":"PetMatch Team",
        "SenderEmail":"tabordam@oregonstate.edu",
        "Subject":"New Pet Added to Database",
        "ContactsListID":"26898",
        "Title":"New_Pet"
    })
    request
        .then((result) => {
            console.log(result.body)
                var campID = result.body.Data[0].ID;
            //  console.log(campID);
                newEmail(campID, new_pet);
        })
        .catch((err) => {
            console.log(err.statusCode)
        })
 }

 //This function triggers a welcome email when the user subscribes  
function welcomeEmail(email, name){
    const mailjet = require ('node-mailjet')
    .connect("9dbbe33c1a4b07ca9aeaa6ae5d366127", "7c5f340ccb4c06a5d3e31c4d6d90ac71")
    const request = mailjet
        .post("send", {'version': 'v3.1'})
        .request({
            "Messages":[{
                "From": {
                    "Email": "tabordam@oregonstate.edu",
                    "Name": "PetMatch Team"
                },
                "To": [{
                    "Email": email,
                    "Name": name
                }],
                "Subject": "Welcome to PetMatch",
                "TextPart": "Dear " + name + " Welcome to PetMatch! We look forward to helping you find your new best friend!",
                "HTMLPart": "<h3>Dear " + name + ", Welcome to Petmatch! </h3><br />We look forward to helping you find your new best friend!"
            }]
        })
    request
        .then((result) => {
            console.log(result.body)
        })
        .catch((err) => {
            console.log(err.statusCode)
        })
}
// This function subscribe the user to the mailing list 
 function addContact(user, email) {
    const mailjet = require ('node-mailjet')
    .connect("9dbbe33c1a4b07ca9aeaa6ae5d366127", "7c5f340ccb4c06a5d3e31c4d6d90ac71")
    const request = mailjet
    .post("contactslist", {'version': 'v3'})
    .id(26898)
    .action("managecontact")
    .request({
      "Name":user,
      "Properties":"object",
      "Action":"addnoforce",
      "Email":email
    })
request
    .then((result) => {
        console.log(result.body)
    })
    .catch((err) => {
        console.log(err.statusCode)
    })

 }


/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */
router.use(function (req,res,next) {
    next();
})

// Main landing page
router.get('/', function(req, res) {
    
    // Manually choose the 3 animals to highlight on the carousel
    context = {
        "title": "PetMatch Home",
        "animals": [
            {
                'id': '5654140684337152',
                'pic': 'https://tgp-pet-cs467.appspot.com.storage.googleapis.com/daf78290-d9ea-11ea-8bb5-cba761a902d2_20151101_173320.jpg'
            },
            {
                'id': '5658442790338560',
                'pic': 'https://tgp-pet-cs467.appspot.com.storage.googleapis.com/0e61b740-d9be-11ea-b33a-a17ccd48e9b2_Turtle.jpg'
            },
            {
                'id': '5748214695198720',
                'pic': 'https://tgp-pet-cs467.appspot.com.storage.googleapis.com/e492bb20-d9b9-11ea-9133-a946cfcff170_image2.jpeg'
            }
        ]
    }        

    res.render('home', context);
})

// Main landing page
router.get('/resources', function(req, res) {
    context = {
        "title": "PetMatch Resources"
    }
    res.render('resources', context);
})

// Search for pets
// If filters are selected, it should update the URL as a query
router.get('/search', function(req, res) {
    // Get information from the URL passed as parameters
    let filters = JSON.parse(JSON.stringify(url.parse(req.url,true).query));
    
    // Only show available pets.  This could be changed to a toggle
    filters['status'] = 'Available';

    context = {
        "title": "PetMatch Search"
    }

    read_pets(filters).then( (entities) => {
        context.animals = entities;
        res.render('search', context);
    })
})

// Add a pet, display the webpage form 
router.get('/add-a-pet', function(req, res) {
    context = {
        "title": "Add-a-Pet"
    }
    res.render('add-a-pet', context);
})

// Post a pet based on form filled out on webpage
router.post('/add-a-pet', uploadHandler.any(), function(req, res) {    
    var new_pet = {
        "petName": req.body.petName,
        "type": req.body.type,
        "typeOther": req.body.typeother,
        "breed": req.body.breed,
        "available": req.body.available,
        "description": req.body.description,
        "status": req.body.status,
        "birthday": req.body.birthday,
        "pic": req.files[0].path
    }
    // Set values of checkboxes 
    new_pet.dispDogs = (req.body.dispDogs == 'on');
    new_pet.dispCats = (req.body.dispCats == 'on');
    new_pet.dispKids = (req.body.dispKids == 'on');
    new_pet.dispLeash = (req.body.dispLeash == 'on');
    new_pet.dispHouse = (req.body.dispHouse == 'on');

    if(req.body.idToken == 'undefined' || req.body.idToken.length == 0) { // If user is not logged in
        context = {
            "title": "Add-a-Pet"
        }
        context.warning = "Please log in and refresh page before you enter a new pet";
        res.render('add-a-pet', context);
    } else { // If user is logged in
        user = jwt_decode(req.body.idToken);
        // Check if user is an administrator
        check_admin(user.sub).then( (admin) => {            
            if(admin) {
                create_pet(new_pet).then( (id) => {
                    new_pet.id = id.id;
                    // console.log(new_pet);
                    createCampaign(new_pet);
                    res.redirect('/');
                })
            } else {
                context = {
                    "title": "Add-a-Pet"
                }
                context.warning = "You must be an administrator to add a new pet";
                res.render('add-a-pet', context);
            }
        })
    }
}) 

// Display the detailed profile of a specific animal
// The id is the unique id of the animal
router.get('/profile/:id', function(req, res) {
 
    read_pet(req.params.id).then( (pet) => {
        context = {
            "title": "Pet Profile"
        }
        context.animal = pet[0];
        res.render('profile', context);
    })

})

// Work to adopt a given animal
// The id is the unique id of the animal
router.post('/profile/:id', function(req, res) {
 
    if(req.body.idToken == 'undefined' || req.body.idToken.length == 0) { // If user is not logged in
        
        // console.log("not logged in");
        read_pet(req.params.id).then( (pet) => {
            context = {
                "title": "Pet Profile"
            }
            context.animal = pet[0];
            context.warning = "Please log in before you adopt!";
            res.render('profile', context);
        })
    } else { // If user is logged in
        // console.log(req.body.idToken);
        user = jwt_decode(req.body.idToken);

        read_pet(req.params.id).then( (pet) => {
            context = {
                "title": "Pet Profile"
            }
            context.animal = pet[0];
            context.user = user;
            res.render('adopt', context);
        })
    }
})

// Function to accept an application from profile page and remove animal from search database
router.post('/adopt/:id', function(req, res) {
     
    var adopt_form = {
        "adopterName": req.body.adopterName,
        "adopterEmail": req.body.adopterEmail,
        "refOne": req.body.refOne,
        "phoneOne": req.body.phoneOne,
        "petBefore": req.body.petBefore,
        "experience": req.body.experience,
        "whyInterested": req.body.whyInterested,
        "petID": req.params.id
    }

    // Add default values even if not selected
    adopt_form.hasKids = (req.body.hasKids == 'on');
    adopt_form.hasDogs = (req.body.hasDogs == 'on');
    adopt_form.hasCats = (req.body.hasCats == 'on');
    adopt_form.mustHouse = (req.body.mustHouse == 'on');
    adopt_form.mustLeash = (req.body.mustLeash == 'on');

    adopt_pet(req.params.id, adopt_form).then( () => {
        res.render('home');
    })
    
})

// Create a new user as an admin
router.post('/admin', function(req, res) {

    if(req.body.idToken == 'undefined' || req.body.idToken.length == 0) { // If user is not logged in
        
        read_users().then( (entities) => {
            context = {
                "title": "Administrators"
            }
            context['admins'] = entities;
            context['warning'] = "Please log in before you make yourself an admin!";
            res.render('admins', context);
        })

    } else { // If user is logged in

        user = jwt_decode(req.body.idToken);

        var new_user = {
            "sub": user.sub,
            "name": user.name,
            "email": user.email,
            "admin": true,
        }

        create_user(new_user).then( () => {
            res.redirect('/admin');
        })
    }
})

// Get a list of pending adoptions
router.get('/pending', function(req, res) {

    read_pending().then( (entities) => {
        context = {
            "title": "Pending Adoptions"
        }
                
        context['pending'] = entities;
        res.render('pending', context);
    })
})

// Get a list of users
router.get('/admin', function(req, res) {

    read_users().then( (entities) => {
        context = {
            "title": "Administrators"
        }
        context['admins'] = entities;
        res.render('admins', context);
    })
})

// This is supposed to send email to the right user instead of a static user 
router.post('/subscribe', function(req, res) {
 
    if(req.body.idToken == 'undefined' || req.body.idToken.length == 0) { // If user is not logged in
        context = {
            "title": "Subscribe"
        }
        context.warning = "Please log in before you subscribe!";
             res.render('search', context);

    } else { // If user is logged in
        user = jwt_decode(req.body.idToken);
        welcomeEmail(user.email, user.name)
        addContact(user.name, user.email)
    res.render('subscribe')
    }
    
})

/* ------------- End Controller Functions ------------- */
app.use('/', router);
// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});