var auth2;
document.getElementById("signOut").style.visibility="hidden"

function onSignIn(googleUser) {
  auth2 = gapi.auth2.init({
    client_id: '113184584603-u14ob4lgaf85mvv7a2fvl5ar0h3oicus.apps.googleusercontent.com'
  });

  // var profile = googleUser.getBasicProfile();

  if (auth2.isSignedIn.get()) {
    
    var id_token = googleUser.getAuthResponse().id_token;
    // document.getElementById("idToken").value = id_token;

    localStorage.setItem('token', id_token);
    document.getElementById("signOut").style.visibility="visible"
  }
  // location.reload();
}


function signOut() {
  auth2 = gapi.auth2.getAuthInstance();
  localStorage.removeItem('token');
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
  document.getElementById("signOut").style.visibility="hidden"
  location.reload();
}



function removeEmpties() {
  var form = document.getElementById("searchForm");
  var inputs = form.children;
  var remove = [];
  for(var i = 0; i < inputs.length; i++) {
      if(inputs[i].value == "") {
          remove.push(inputs[i]);
          console.log (inputs[i].value);
      }
  }

  if(remove.length == inputs.length - 1)
    return false;

  for(var i = 0; i < remove.length; i++) 
    form.removeChild(remove[i]);
  return true;
}

function addID() {
  id_token = localStorage.getItem('token');
  document.getElementById("idToken").value = id_token;
}

// Code for Profile Page
// <!--script for type pic-->
// <!--when the certain type shows up, eliminate the html to print the other images-->


function addQuote() {

  var randomizer = Math.floor(Math.random() * Math.floor(10))
  console.log (randomizer);

    if (randomizer <5) {
      $.getJSON( "https://cors-anywhere.herokuapp.com/http://dog-api.kinduff.com/api/facts?number=1", function(data){ 
        $("#myQuote").text(data.facts);
          console.log(data);
        });  
    } else{
      $.getJSON( "https://catfact.ninja/fact?max_length=200", function(data){ 
        $("#myQuote").text(data.fact);
          console.log(data);
      });
    }
}

$("#type").change(function() {
  if ($(this).val() == "cat") {
    $("#breed").load("breeds/" + $(this).val() + ".txt");
    $('#breed').show();
    $('#breed').attr('required', '');
    $('#otherTypeDiv').hide();
    $('#otherTypeDiv').removeAttr('required');
  }
  if ($(this).val() == "dog") {
    $("#breed").load("breeds/" + $(this).val() + ".txt");
    $('#breed').show();
    $('#breed').attr('required', '');
    $('#otherTypeDiv').hide();
    $('#otherTypeDiv').removeAttr('required');
  }
  if ($(this).val() == "other" || $(this).val() == "all" || $(this).val() == "" ) {
    $('#otherTypeDiv').show();
    $('#otherTypeDiv').attr('required', '');
    $('#breed').hide();
    $('#breed').removeAttr('required');
  }
});


function profileOnload(animalType,animalKids,animalDogs,animalCats,animalHouse,animalLeash)
{
  id_token = localStorage.getItem('token');
  document.getElementById("idToken").value = id_token;

  if (animalType=="dog")
  {
    document.getElementById("printCatImage").innerHTML=""
    document.getElementById("printOtherImage").innerHTML=""
  }
  else if (animalType=="cat")
  {
    document.getElementById("printDogImage").innerHTML=""
    document.getElementById("printOtherImage").innerHTML=""
  }
  else
  {
    document.getElementById("printCatImage").innerHTML=""
    document.getElementById("printDogImage").innerHTML=""
  }

  if (animalKids == "false") {
    document.getElementById("printKids").innerHTML = "";
  }
  if (animalDogs == "false") {
    document.getElementById("printDogs").innerHTML = "";
  }
  if (animalCats == "false") {
    document.getElementById("printCats").innerHTML = "";
  }
  if (animalHouse == "false") {
    document.getElementById("printHouse").innerHTML = "";
  }
  if (animalLeash == "false") {
    document.getElementById("printLeash").innerHTML = "";
  }

  if(availableStatus != "available")
  {
    document.getElementById("printButton").innerHTML=""
  }
  
}

//https://stackoverflow.com/questions/16207575/how-to-preview-an-image-before-and-after-upload
function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function(e) {
      $('#ImdID').attr('src', e.target.result);
    };

    reader.readAsDataURL(input.files[0]);
  }
}
