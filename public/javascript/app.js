
var p3App = angular.module('p3App', [
	'ui.router',
	'firebase'
]);

p3App.config(['$stateProvider', '$locationProvider', '$urlRouterProvider',
	function($stateProvider, $locationProvider, $urlRouterProvider) {
		$locationProvider.html5Mode(true);

		$urlRouterProvider.otherwise('/signin');

		$stateProvider.
			state('home', {
				url: '/',
				views: {
					"content" : {
						templateUrl:'/partials/home.html',
						controller: 'HomeCtrl'
					}
				}
			})
			.state('chatroom', {
				url: '/chatroom/:chatroomId',
				// controller: 'ChatroomCtrl',
				views: {
					"content": {
						templateUrl: '/partials/chatroom.html',
						controller: 'ChatroomCtrl'
					},
					"user-list": {
						templateUrl: '/partials/userList.html',
						controller: 'ChatroomUsersCtrl'
					}
				}
			})
			.state("signin", {
				url: '/signin',
			    onEnter: function($stateParams, $state, $rootScope, $window) {

			    	$rootScope.userModel.username = $window.prompt("Please choose a username.");
			    	if(!$rootScope.userModel.username){
					  $rootScope.userModel.username = "anonymous"+Math.floor(Math.random()*1111);
					}

					$state.go('home');

			    	// $scope.userModel.username = window.prompt("Welcome, warrior! please declare your name?");
					// if(!$scope.userModel.username){
					//   $scope.username = "anonymous"+Math.floor(Math.random()*1111);
					// }

			        // $modal.open({
			        //     templateUrl: "items/add",
			        //     resolve: {
			        //       item: function() { new Item(123).get(); }
			        //     },
			        //     controller: ['$scope', 'item', function($scope, item) {
			        //       $scope.dismiss = function() {
			        //         $scope.$dismiss();
			        //       };

			        //       $scope.save = function() {
			        //         item.update().then(function() {
			        //           $scope.$close(true);
			        //         });
			        //       };
			        //     }]
			        // }).result.then(function(result) {
			        //     if (result) {
			        //         return $state.transitionTo("items");
			        //     }
			        // });
			    }
			});
	}
]);

p3App.run(['$rootScope', 'Chatrooms', '$state', '$window',
	function($rootScope, $chatrooms, $state, $window) {

		$rootScope.userModel = {};

		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			// console.log('state change:', fromState.name);

			if(!$rootScope.userModel.username) {
				// event.preventDefault();
				// $state.go('signin');

				$rootScope.userModel.username = $window.prompt("Please choose a username.");
		    	if(!$rootScope.userModel.username){
				  $rootScope.userModel.username = "anonymous"+Math.floor(Math.random()*1111);
				}
			} else if(fromState.name == 'chatroom') {
				$chatrooms.signout(fromParams.chatroomId, $rootScope.userModel.username);
				// console.log('blah');
			}
		});
	}
])

p3App.factory('Chatrooms', ['$firebase',
	function($firebase) {

		var fb_base = $firebase(new Firebase("https://glaring-fire-5264.firebaseio.com/")),
			fb_chatroom = fb_base.$child('chatrooms');

		var chatsProvider = {

			list: function() {
				return fb_chatroom;
			},

			newRoom: function() {
				return fb_chatroom.$add({});
			},

			get: function(id) {
				return fb_chatroom.$child(id);
			},

			getUsers: function(id) {
				return fb_chatroom.$child(id + "/users");
			},

			getEmoticons: function(id) {
				return fb_chatroom.$child(id + "/emoticons");
			},

			send: function(id, message, username) {
				fb_chatroom.$child(id + '/stream').$add({
					m: message,
					username: username
				});
			},

			sendEmoticon: function(id, username, blob) {
				fb_chatroom.$child(id + '/stream').$add({
					username: username,
					v: blob
				});
			},	

			signin: function(id, username) {
				// console.log('signing in');
				var users = fb_chatroom.$child(id + '/users');
				users[username] = true;
				users.$save(username);

				var ref = new Firebase("https://glaring-fire-5264.firebaseio.com/chatrooms/" + id + "/users/" + username);
				ref.onDisconnect().remove();
			},

			signout: function(id, username) {
				// console.log('signing out');
				fb_chatroom.$child(id + '/users').$remove(username);

				var ref = new Firebase("https://glaring-fire-5264.firebaseio.com/chatrooms/" + id + "/users/" + username);
				ref.onDisconnect().cancel();
			}
		};

		return chatsProvider;
	}
]);

p3App.factory('Base64Converter', [
	function() {
		  // some handy methods for converting blob to base 64 and vice versa
		  // for performance bench mark, please refer to http://jsperf.com/blob-base64-conversion/5
		  // note useing String.fromCharCode.apply can cause callstack error
		return {
			blobToBase64: function(blob, callback) {
				var reader = new FileReader();
				reader.onload = function() {
					var dataUrl = reader.result;
					var base64 = dataUrl.split(',')[1];
					callback(base64);
				};
				reader.readAsDataURL(blob);
			},
			base64ToBlob: function(base64) {
				var binary = atob(base64);
				var len = binary.length;
				var buffer = new ArrayBuffer(len);
				var view = new Uint8Array(buffer);
				for (var i = 0; i < len; i++) {
					view[i] = binary.charCodeAt(i);
				}
				var blob = new Blob([view]);
				return blob;
			}
		};
	}
]);

p3App.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if(event.which === 13) {
				scope.$apply(function () {
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
});

p3App.directive('chatVideo', ['$timeout', '$rootScope', 'Base64Converter', 'Chatrooms', function($timeout, $rootScope, $b64, $chatrooms) {
	return {
		restrict: 'AE',
		link: function(scope, element, attrs) {

			scope.mediaRecorder = null;

			// connect to webcam
			var mediaConstraints = {
		      video: true,
		      audio: false
		    };

		 	scope.recordVideo = function() {
		 		$timeout(function() {

			      	$b64.blobToBase64(scope.curVideoBlob, function(b64Blob) {
			      		$chatrooms.sendEmoticon($rootScope.chatroomId, $rootScope.userModel.username, b64Blob);
			      	});

		 		}, 1500);
		 	};

		    var onMediaSuccess = function(stream) {
		    	// create video element, attach webcam stream to video element
			      var video = document.createElement('video');
			      // element.html('');
			      // adds these properties to the video
			      video = mergeProps(video, {
			          controls: false,
			          src: URL.createObjectURL(stream)
			      });
			      video.play();
			      element.prepend(video);

			      // now record stream in 5 seconds interval
			      // var video_container = document.getElementById('video_container');
			      scope.mediaRecorder = new MediaStreamRecorder(stream);
			      // var index = 1;

			      scope.mediaRecorder.mimeType = 'video/webm';
			      // mediaRecorder.mimeType = 'image/gif';
			      // make recorded media smaller to save some traffic (80 * 60 pixels, 3*24 frames)
			      scope.mediaRecorder.video_width = 80;
			      scope.mediaRecorder.video_height = 60;

			      scope.mediaRecorder.ondataavailable = function(blob) {
			      	// scope.$apply(function() {
			      		// scope.videoBlob = blob;
			      		// scope.sendEmoticon(blob);

			      		scope.curVideoBlob = blob;

			      	// });
			      };

			      // counter
			      // var time = 0;
			      // var second_counter = document.getElementById('second_counter');
			      // var second_counter_update = setInterval(function(){
			      //   second_counter.innerHTML = time++;
			      // },1000);


			      // mediaRecorder.ondataavailable = function (blob) {
			      //     //console.log("new data available!");
			      //     video_container.innerHTML = "";

			      //     // convert data into base 64 blocks
			      //     blob_to_base64(blob,function(b64_data){
			      //       cur_video_blob = b64_data;
			      //     });
			      // };
			      setInterval( function() {
			        scope.mediaRecorder.stop();
			        scope.mediaRecorder.start(1500);
			      }, 1500 );
			      console.log("connect to media stream!");
		    };

		    var onMediaError = function(e) {
		      console.error('media error', e);
		    };

			navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
		}
	};
}]);

p3App.controller('AppCtrl', ['$scope', '$state',
	function($scope, $state) {

		$scope.$on('$stateChangeSuccess', function(event, toState) {
			$scope.currentState = toState.name;
		});

		// $scope.userModel.username = window.prompt("Welcome, warrior! please declare your name?");
		// if(!$scope.userModel.username){
		//   $scope.username = "anonymous"+Math.floor(Math.random()*1111);
		// }
	}
]);

p3App.controller('HomeCtrl', ['$scope', '$state', 'Chatrooms',
	function($scope, $state, $chatrooms) {
		$scope.chatrooms = $chatrooms.list();

		$scope.makeNewChat = function() {
			var ref = $chatrooms.newRoom();
			$state.go('chatroom', {chatroomId: ref.name()});
		};
	}
]);

p3App.controller('ChatroomCtrl', ['$scope', '$rootScope', '$stateParams', 'Chatrooms', '$window', 'Base64Converter',
	function($scope, $rootScope, $stateParams, $chatrooms, $window, $b64) {
		$rootScope.chatroomId = $stateParams['chatroomId'];
		$scope.chatroom = $chatrooms.get($stateParams['chatroomId']);
		$scope.users = $chatrooms.getUsers($stateParams['chatroomId']);

		// while(!$rootScope.userModel.username) {
		// 	// $scope.userModel.username = $window.prompt("Please choose a username");
		// 	$rootScope.userModel.username = 'david';
		// }

		$chatrooms.signin($rootScope.chatroomId, $rootScope.userModel.username);

		$scope.sendChatMessage = function() {
			// console.log($scope.chatMessage);
			if(!$scope.chatMessage || $scope.chatMessage == '') return;
			$chatrooms.send($rootScope.chatroomId, $scope.chatMessage, $rootScope.userModel.username);
			$scope.chatMessage = '';
		};

		var ref = new Firebase("https://glaring-fire-5264.firebaseio.com/chatrooms/" + $rootScope.chatroomId + "/stream");
		ref.on('child_added', function (snapshot) {

			var data = snapshot.val();

			if(data.m) {
		    	$("#chatStream").append("<p>"+data.username + ": " + data.m+"</p>");
			} else if(data.v){
		      // for video element
		      var video = document.createElement("video");
		      video.autoplay = true;
		      video.controls = false; // optional
		      video.loop = true;
		      video.width = 120;

		      var source = document.createElement("source");
		      source.src =  URL.createObjectURL($b64.base64ToBlob(data.v));
		      source.type =  "video/webm";

		      video.appendChild(source);

		      // for gif instead, use this code below and change mediaRecorder.mimeType in onMediaSuccess below
		      // var video = document.createElement("img");
		      // video.src = URL.createObjectURL(base64_to_blob(data.v));
		      $("#chatStream").append("<p>"+data.username + ":</p>");
		      document.getElementById("chatStream").appendChild(video);
		    }




			// var data = snapshot.val();

			// var video = document.createElement("video");
	  //     	video.autoplay = true;
	  //     	video.controls = false; // optional
	  //     	video.loop = true;

	  //     	var source = document.createElement("source");
	  //     	source.src =  URL.createObjectURL($b64.base64ToBlob(data.v));
	  //     	source.type =  "video/webm";

	  //     	video.appendChild(source);

	      	// for gif instead, use this code below and change mediaRecorder.mimeType in onMediaSuccess below
	      	// var video = document.createElement("img");
	      	// video.src = URL.createObjectURL(base64_to_blob(data.v));

	      	// $("#emoticonViewer").html(video);
		});
	}
]);

p3App.controller('ChatroomUsersCtrl', ['$scope', '$stateParams', 'Chatrooms',
	function($scope, $stateParams, $chatrooms) {
		$scope.users = $chatrooms.getUsers($stateParams['chatroomId']);
	}
]);