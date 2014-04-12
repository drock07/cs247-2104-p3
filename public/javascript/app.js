
var p3App = angular.module('p3App', [
	'ui.router',
	'firebase'
]);

p3App.config(['$stateProvider', '$locationProvider', '$urlRouterProvider',
	function($stateProvider, $locationProvider, $urlRouterProvider) {
		$locationProvider.html5Mode(true);

		$urlRouterProvider.otherwise('/');

		$stateProvider.
			state('home', {
				url: '/',
				templateUrl: '/partials/home.html',
				controller: 'HomeCtrl'
			})
			.state('chatroom', {
				url: '/chatroom/:chatroomId',
				templateUrl: '/partials/chatroom.html',
				controller: 'ChatroomCtrl'
			});
	}
]);

p3App.run(['$rootScope', 'Chatrooms',
	function($rootScope, $chatrooms) {
		$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			if(fromState.name == 'chatRoom') {
				// $chatrooms.signout(fromParams.chatroomId, $rootScope.userModel.username);
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

			get: function(id) {
				return fb_chatroom.$child(id);
			},

			send: function(id, message, username) {
				fb_chatroom.$child(id + '/stream').$add({
					m: message,
					username: username
				});
			},

			signin: function(id, username) {
				var users = fb_chatroom.$child(id + '/users');
				users[username] = true;
				users.$save();
			},

			signout: function(id, username) {
				fb_chatroom.$child(id + '/users').$remove(username);
			}
		};

		return chatsProvider;
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

p3App.directive('chatVideo', function() {
	return {
		restrict: 'AE',
		link: function(scope, element, attrs) {

			// connect to webcam
			var mediaConstraints = {
		      video: true,
		      audio: false
		    };

		    var onMediaSuccess = function(stream) {
		    	// create video element, attach webcam stream to video element
			      var video_width= 160;
			      var video_height= 120;
			      var webcam_stream = element;
			      var video = document.createElement('video');
			      webcam_stream.innerHTML = "";
			      // adds these properties to the video
			      video = mergeProps(video, {
			          controls: false,
			          width: video_width,
			          height: video_height,
			          src: URL.createObjectURL(stream)
			      });
			      video.play();
			      webcam_stream.append(video);

			      // counter
			      // var time = 0;
			      // var second_counter = document.getElementById('second_counter');
			      // var second_counter_update = setInterval(function(){
			      //   second_counter.innerHTML = time++;
			      // },1000);

			      // now record stream in 5 seconds interval
			      // var video_container = document.getElementById('video_container');
			      // var mediaRecorder = new MediaStreamRecorder(stream);
			      // var index = 1;

			      // mediaRecorder.mimeType = 'video/webm';
			      // mediaRecorder.mimeType = 'image/gif';
			      // make recorded media smaller to save some traffic (80 * 60 pixels, 3*24 frames)
			      // mediaRecorder.video_width = video_width/2;
			      // mediaRecorder.video_height = video_height/2;

			      // mediaRecorder.ondataavailable = function (blob) {
			      //     //console.log("new data available!");
			      //     video_container.innerHTML = "";

			      //     // convert data into base 64 blocks
			      //     blob_to_base64(blob,function(b64_data){
			      //       cur_video_blob = b64_data;
			      //     });
			      // };
			      // setInterval( function() {
			      //   mediaRecorder.stop();
			      //   mediaRecorder.start(3000);
			      // }, 3000 );
			      console.log("connect to media stream!");
		    };

		    var onMediaError = function(e) {
		      console.error('media error', e);
		    };

			navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
		}
	};
});

p3App.controller('AppCtrl', ['$scope', 
	function($scope) {
		// $scope.userModel.username = window.prompt("Welcome, warrior! please declare your name?");
		// if(!$scope.userModel.username){
		//   $scope.username = "anonymous"+Math.floor(Math.random()*1111);
		// }

		$scope.userModel = {};
	}
]);

p3App.controller('HomeCtrl', ['$scope', 'Chatrooms',
	function($scope, $chatrooms) {
		$scope.chatrooms = $chatrooms.list();
	}
]);

p3App.controller('ChatroomCtrl', ['$scope', '$stateParams', 'Chatrooms', '$window',
	function($scope, $stateParams, $chatrooms, $window) {
		$scope.chatroomId = $stateParams['chatroomId'];
		$scope.chatroom = $chatrooms.get($stateParams['chatroomId']);

		while(!$scope.userModel.username) {
			// $scope.userModel.username = $window.prompt("Please choose a username");
			$scope.userModel.username = 'david';
		}

		$chatrooms.signin($scope.chatroomId, $scope.userModel.username);

		$scope.sendChatMessage = function() {
			// console.log($scope.chatMessage);
			if(!$scope.chatMessage || $scope.chatMessage == '') return;
			$chatrooms.send($scope.chatroomId, $scope.chatMessage, $scope.userModel.username);
			$scope.chatMessage = '';
		};
	}
]);