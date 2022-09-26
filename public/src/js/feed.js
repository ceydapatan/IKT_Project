let shareImageButton = document.querySelector('#share-image-button');
let createPostArea = document.querySelector('#create-post');
let closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
let sharedMomentsArea = document.querySelector('#shared-moments');
let form = document.querySelector('form');
let titleInput = document.querySelector('#title');
let locationInput = document.querySelector('#location');
let videoPlayer = document.querySelector('#player');
let canvasElement = document.querySelector('#canvas');
let captureButton = document.querySelector('#capture-btn');
let imagePicker = document.querySelector('#image-picker');
let imagePickerArea = document.querySelector('#pick-image');
let file = null;
let titleValue = '';
let locationValue = '';
let imageURI = '';
let locationButton = document.querySelector('#location-btn');
let locationLoader = document.querySelector('#location-loader');
let fetchedLocation;



shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);



function createCard(card) {
    //console.log('das ist card ' + JSON.stringify(card));
  let cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  let cardTitle = document.createElement('div');
  let deleteButton = document.createElement('button');
  cardTitle.className = 'mdl-card__title';
  deleteButton.className = 'mdl-button mdl-js-button mdl-button--fab mdl-button--colored delete-btn';
  deleteButton.addEventListener('click', sayHi);
  deleteButton.innerHTML = 'delete';
  deleteButton.id = card.post_id;
  cardTitle.id = card.post_id;
  //deleteButton.addEventListener('click', deleteOnePicture(deleteButton.id), false);
  let image = new Image();
  image.src = card.image_id;
  cardTitle.style.backgroundImage = 'url('+ image.src +')';
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  cardTitle.appendChild(deleteButton);
  let cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = card.title;
  cardTitle.appendChild(cardTitleTextElement);
  let cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = card.location;
  cardSupportingText.style.textAlign = 'center';
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

let test = document.getElementsByClassName("mdl-textfield__input");


console.log('das ist test ' + JSON.stringify(test));



/*function deleteOnePicture(id){
    console.log('in delete picture');
    fetch('http://localhost:3000/posts/' + id, {
        method: 'DELETE',
      })
      .then(res => res.text()) // or res.json()
      .then(res => console.log(res))

} */


let networkDataReceived = false;

fetch('http://localhost:3000/posts')
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        networkDataReceived = true;
        console.log('From backend ...', data);
        updateUI(data);
    });

if('indexedDB' in window) {
    readAllData('posts')
        .then( data => {
            if(!networkDataReceived) {
                console.log('From cache ...', data);
                updateUI(data);
            }
        })
}


    function updateUI(data) {

      for(let card of data)
      {
         createCard(card);
      }

  }


  function sendDataToBackend() {
    console.log('enamore');
    const formData = new FormData();
    formData.append('title', titleValue);
    formData.append('location', locationValue);
    formData.append('file', file);

    console.log('formData', formData)

    fetch('http://localhost:3000/posts', {
        method: 'POST',
        body: formData
    })
    .then( response => {
        console.log('Data sent to backend ...', response);
        return response.json();
    })
    .then( data => {
        console.log('data ...', data);
        const newPost = {
            title: data.title,
            location: data.location,
            image_id: imageURI
        }
        updateUI([newPost]);
    });
}

form.addEventListener('submit', event => {
    event.preventDefault(); // nicht absenden und neu laden

    if (file == null) {
        alert('Erst Foto aufnehmen!')
        return;
    }
    if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
        alert('Bitte Titel und Location angeben!')
        return;
    }

    closeCreatePostModal();

    titleValue = titleInput.value;
    locationValue = locationInput.value;
    console.log('titleInput', titleValue)
    console.log('locationInput', locationValue)
    console.log('file', file)

    if('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
            .then( sw => {
                let post = {
                    id: new Date().toISOString(),
                    title: titleValue,
                    location: locationValue,
                    image_id: file
                };

                writeData('sync-posts', post)
                .then( () => {
                    return sw.sync.register('sync-new-post');
                })
                .then( () => {
                    let snackbarContainer = new MaterialSnackbar(document.querySelector('#confirmation-toast'));
                    let data = { message: 'Eingaben zum Synchronisieren gespeichert!', timeout: 2000};
                    snackbarContainer.showSnackbar(data);
                });
            });
    } else {
        sendDataToBackend();
    }
});


function initializeMedia() {
  if(!('mediaDevices' in navigator)) {
      navigator.mediaDevices = {};
  }

  if(!('getUserMedia' in navigator.mediaDevices)) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
          let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

          if(!getUserMedia) {
              return Promise.reject(new Error('getUserMedia is not implemented'));
          }

          return new Promise( (resolve, reject) => {
              getUserMedia.call(navigator, constraints, resolve, reject);
          })
      }
  }

  navigator.mediaDevices.getUserMedia({video: true})
  .then( stream => {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
  })
  .catch( err => {
      imagePickerArea.style.display = 'block';
  });
}


captureButton.addEventListener('click', event => {
  event.preventDefault(); // nicht absenden und neu laden
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  let context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
  videoPlayer.srcObject.getVideoTracks().forEach( track => {
      track.stop();
  })
  imageURI = canvas.toDataURL("image/jpeg");
  // console.log('imageURI', imageURI)       // base64-String des Bildes

  fetch(imageURI)
  .then(res => {
      return res.blob()
  })
  .then(blob => {
      file = new File([blob], "myFile.jpg", { type: "image/jpeg" })
      console.log('file', file)
  })
});


imagePicker.addEventListener('change', event => {
  file = event.target.files[0];
});


function openCreatePostModal() {
  setTimeout( () => {
      createPostArea.style.transform = 'translateY(0)';
  }, 1);
  initializeMedia();
  initializeLocation();

}

function closeCreatePostModal() {
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  locationButton.style.display = 'inline';
  locationLoader.style.display = 'none';
  if(videoPlayer.srcObject) {
      videoPlayer.srcObject.getVideoTracks().forEach( track => track.stop());
  }
  setTimeout( () => {
      createPostArea.style.transform = 'translateY(100vH)';
  }, 1);
}


locationButton.addEventListener('click', event => {
    if(!('geolocation' in navigator)) {
        return;
    }

    locationButton.style.display = 'none';
    locationLoader.style.display = 'block';

    navigator.geolocation.getCurrentPosition( position => {
        locationButton.style.display = 'inline';
        locationLoader.style.display = 'none';
        fetchedLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        console.log('current position: ', fetchedLocation);

        let nominatimURL = 'https://nominatim.openstreetmap.org/reverse'; 
        nominatimURL += '?format=jsonv2';   // format=[xml|json|jsonv2|geojson|geocodejson]
        nominatimURL += '&lat=' + fetchedLocation.latitude;
        nominatimURL += '&lon=' + fetchedLocation.longitude;

        fetch(nominatimURL)
            .then((res) => {
                console.log('nominatim res ...', res);
                return res.json();
            })
            .then((data) => {
                console.log('nominatim res.json() ...', data);
                locationInput.value = data.display_name;
                return data;
            })
            .then( d => {
                locationButton.style.display = 'none';
                locationLoader.style.display = 'none';
                mapDiv.style.display = 'block';

                const map = new ol.Map({
                    target: 'map',
                    layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM()
                    })
                    ],
                    view: new ol.View({
                    center: ol.proj.fromLonLat([fetchedLocation.longitude, fetchedLocation.latitude]),
                    zoom: 12
                    })
                });

                const layer = new ol.layer.Vector({
                    source: new ol.source.Vector({
                        features: [
                            new ol.Feature({
                                geometry: new ol.geom.Point(ol.proj.fromLonLat([fetchedLocation.longitude, fetchedLocation.latitude]))
                            })
                        ]
                    })
                });
 
                map.addLayer(layer);

                console.log('map', map)
            })
            .catch( (err) => {
                console.error('err', err)
                locationInput.value = 'In Berlin';
            });

        document.querySelector('#manual-location').classList.add('is-focused');

    }, err => {
        console.log(err);
        locationButton.style.display = 'inline';
        locationLoader.style.display = 'none';
        alert('Couldn\'t fetch location, please enter manually!');
        fetchedLocation = null;
    }, { timeout: 5000});
});

function initializeLocation() {
    if(!('geolocation' in navigator)) {
        locationButton.style.display = 'none';
    }
}

let fotos = document.getElementsByClassName("delete-btn");
console.log('das ist fotos ' + JSON.stringify(fotos));



for (var i = 0; i < fotos.length; i++) {
    console.log('in for');
    fotos[i].addEventListener('click', sayHi);
} 


function sayHi(evt){

    var result = confirm("Want to delete?");

if (result)
{
    console.log('I am saying Hi ' + evt.target.id);
    fetch('http://localhost:3000/posts/' + evt.target.id, {
        method: 'DELETE',
      })
      .then(res => res.text()) 
      .then(res => console.log(res))
      window.location.reload();

}
}






