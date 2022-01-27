// BLOB OBJECT URL 로 저장하기
fetch(`https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Free_logo.svg/1920px-Free_logo.svg.png`)
.then(response => response.blob())
.then(function(myBlob) {
  var objectURL = URL.createObjectURL(myBlob);
  let myImage = document.querySelector('#nononono');
  myImage.src = objectURL;
});

// BLOB BASE64 로 저장하기
function urlContentToDataUri(url){
    return  fetch(url)
            .then( response => response.blob() )
            .then( blob => new Promise( callback =>{
                let reader = new FileReader() ;
                reader.onload = function(){ callback(this.result) } ;
                reader.readAsDataURL(blob) ;
            }) ) ;
}

//Usage example:
urlContentToDataUri('http://example.com').then( dataUri => console.log(dataUri) ) ;

//Usage example using await:
let dataUri = await urlContentToDataUri('http://example.com') ;
console.log(dataUri) ;