
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
			}
		};

		return chatsProvider;
	}
]);

p3App.controller('HomeCtrl', ['$scope', 'Chatrooms',
	function($scope, $chatrooms) {
		$scope.chatrooms = $chatrooms.list();
	}
]);

p3App.controller('ChatroomCtrl', ['$scope', '$stateParams', 'Chatrooms',
	function($scope, $stateParams, $chatrooms) {
		$scope.chatroom = $chatrooms.get($stateParams['chatroomId']);
	}
]);