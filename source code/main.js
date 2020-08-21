var auth2;

function onSignIn(googleUser) {
  auth2 = gapi.auth2.init({
    client_id: '113184584603-u14ob4lgaf85mvv7a2fvl5ar0h3oicus.apps.googleusercontent.com'
  });

  // var profile = googleUser.getBasicProfile();

  if (auth2.isSignedIn.get()) {
    // var profile = auth2.currentUser.get().getBasicProfile();
    // console.log('ID: ' + profile.getId());
    // console.log('Full Name: ' + profile.getName());
    // console.log('Given Name: ' + profile.getGivenName());
    // console.log('Family Name: ' + profile.getFamilyName());
    // console.log('Image URL: ' + profile.getImageUrl());
    // console.log('Email: ' + profile.getEmail());
    
    var id_token = googleUser.getAuthResponse().id_token;
    // document.getElementById("idToken").value = id_token;

    localStorage.setItem('token', id_token);
  }
}

function addID() {
  id_token = localStorage.getItem('token');
  document.getElementById("idToken").value = id_token;
}

function signOut() {
  auth2 = gapi.auth2.getAuthInstance();
  localStorage.removeItem('token');
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
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

// Code for Profile Page
// <!--script for type pic-->
// <!--when the certain type shows up, eliminate the html to print the other images-->

function showType(thisType, dispKids,  dispDogs, dispCats, dispHouse, dispLeash)
{
  var thisOtherType = "{{this.animal.typeOther}}";

  if (thisType=="Dog")
  {
    document.getElementById("printCatImage").innerHTML=""
    document.getElementById("printOtherImage").innerHTML=""
  }
  else if (thisType=="Cat")
  {
    document.getElementById("printDogImage").innerHTML=""
    document.getElementById("printOtherImage").innerHTML=""
  }
  else
  {
    document.getElementById("printCatImage").innerHTML=""
    document.getElementById("printDogImage").innerHTML=""
  }
  
  // <!--script for disp pics-->
  // <!--if a disp is false, eliminate the code to print the image-->
  if (dispKids=="false") 
  {
    document.getElementById("printKids").innerHTML=""
  }
  if (dispDogs=="false") 
  {
    document.getElementById("printDogs").innerHTML=""
  }
  if (dispCats=="false") 
  {
    document.getElementById("printCats").innerHTML=""
  }
  if (dispHouse=="false") 
  {
    document.getElementById("printHouse").innerHTML=""
  }
  if (dispLeash == "false") 
  {
    document.getElementById("printLeash").innerHTML=""
  }
}

function showAdoptButton(availableStatus)
{
  if(availableStatus != "available")
  {
    document.getElementById("printButton").innerHTML=""
  }
}


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

// $(document).ready(function(){
//   $(".mybutton").on("click", function (){
//   $.getJSON( "https://catfact.ninja/fact?max_length=200", function(data){ 
//     $("#myQuote").text(data.fact);
//       console.log(data);
//      });  
//   });
// });

//Dog Facts 
// $(document).ready(function(){
//   // $(".mybutton").on("click", function (){
//   $.getJSON( "https://cors-anywhere.herokuapp.com/http://dog-api.kinduff.com/api/facts?number=1", function(data){ 
//     $("#myQuote").text(data.facts);
//       console.log(data);
//      });  
//   });
// });

$("#type").change(function() {
  if ($(this).val() == " ") {
  $('#breed').hide();
  $('#otherTypeDiv').hide();
  }
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
  if ($(this).val() == "other") {
  $('#otherTypeDiv').show();
  $('#otherTypeDiv').attr('required', '');
  $('#breed').hide();
  $('#breed').removeAttr('required');
  }
});
