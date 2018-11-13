"use strict"
var SimpleList = React.createClass({displayName: "SimpleList",
	getInitialState: function() {
        return {
			simpleList: [
				{
					CarImageUrl: 'loader.gif'
				}
			]
        };
	},

	componentDidMount: function() {
		$.ajax({
			url: this.props.url,
			dataType: 'text',
			success: function(data) {
				console.log('_________________');
				console.log('Simple List data recieved:');
				console.log('data', data);
				var dataEsc = unescape(data);
				dataEsc = decodeURI(data);
				dataEsc = decodeURIComponent(data);
				//dataEsc = dataEsc.replace('&quot;', '"');
				dataEsc = dataEsc.replace(/&quot;/g, '"');
				console.log('dataEsc', dataEsc);
				var dataJson = JSON.parse(dataEsc); 
				console.log('dataJson', dataJson);
				this.setState({simpleList: dataJson});
			}.bind(this),
				error: function(xhr, status, err) {
					console.log('xhr: ', xhr);
					console.log('err: ', err);
				//console.error(this.props.url, status, err.toString())
			}.bind(this)
		});
	},
	render: function() {
		return (
			React.createElement("span", null, 
				React.createElement("p", null, React.createElement("strong", null, "Cars Inventory")), 
				React.createElement(SimpleListRow, {simpleList: this.state.simpleList})
			)
		);
	}	
});

var SimpleListRow = React.createClass({displayName: "SimpleListRow",
changeCallback: function () {
	console.log('gooool');
},
	render: function() {
		console.log('_________________');
		console.log('simpleList rows data:');
		console.log('this.props', this.props);
		var rows = this.props.simpleList;
		
		return (
			React.createElement("ol", null, 
				rows.map(function(element) {
					return (
						React.createElement("img", 
						{
							className: 'logo',
							src: 'https://s3bucket/images/small/' + element.CarImageUrl,
							onClick: function handleClick() {
								//alert('Are you sure you want to do the Macarena?' + element.CarName)
								var modal = document.getElementById('myModal');
								var image = document.getElementById('imageId');
								var name = document.getElementById('nameId');
								var specifications = document.getElementById('specificationsId');
								image.src = 'https://s3bucket/images/large/' + element.CarImageUrl;
								modal.style.display = "block";
								name.textContent = element.CarName;
								specifications.textContent = element.CarDescription;
	
							  }	
						})
					);
					
				})
			)
		);
	}	
});

React.render(
	React.createElement(SimpleList, {url: "/car/list"}),
	document.getElementById('simpleList')
)