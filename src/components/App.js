import React, { Component } from 'react';
import { debounce } from "debounce";
import Search from './Search';
import Results from './Results';
import Footer from './Footer';
import astronaut from '../resources/astronaut.svg'
import 'antd/dist/antd.css';  // or 'antd/dist/antd.less'
import '../styles/App.css';

window.apiUrl = 'https://instant-username-search-api.herokuapp.com/';
const checkEndpoint = window.apiUrl + 'check';

// AbortController and signal to cancel fetch requests
var controller;
var signal;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sites: [],
      results: [],
      isQueried: false
    }
  }

  componentDidMount = () => {
    // fetch all the services available to check
    fetch(window.apiUrl + 'services/getAll')
      .then(response => response.json())
      .then(responseJson => {
        this.setState({
          sites: responseJson
        });
      })
      .catch((e) => {
        console.log('error while fetching services list' + e.message);
      });
  }

  componentWillUnmount = () => {
    // cancel all requests before unmounting
    this.cancelAllRequests();
  }

  search = (username) => {
    // instantiniate a new controller for this cycle
    controller = new AbortController();
    signal = controller.signal;

    // loop through all sites and check the availability
    for (let i = 0; i < this.state.sites.length; i++) {
      const checkService = this.state.sites[i].endpoint;
      const checkUser = checkService.replace('{username}', username);

      fetch(checkEndpoint + checkUser, { signal })
        .then(response => response.json())
        .then(responseJson => {
          let newResults = [].concat(this.state.results);
          newResults.push(responseJson);
          this.setState({
            results: newResults
          });
        })
        .catch((e) => {
          //console.log(e.message);
        });
    }
  }

  // debounce the search function
  debouncedSearch = debounce(this.search, 800);

  // search on input changes
  inputChanged = (input) => {
    this.setState({
      isQueried: true
    });

    this.cancelAllRequests();
    this.setState({
      results: []
    });

    // invoke debounced search
    this.debouncedSearch(input);
  }

  inputEmptied = () => {
    this.cancelAllRequests();
    this.setState({
      isQueried: false
    });
  }

  cancelAllRequests = () => {
    if (controller !== undefined) {
      controller.abort();
    }
  }

  render() {
    let landingPage = (
      <div className='landing'>
        <img alt='astronaut' className='astronaut' src={astronaut} />
        <div className='intro'>
          <h2>Check username availability as you type</h2>
          <p>Instant username search will check more than 100 social media sites for you. Results will appear here as you type!</p>
        </div>
      </div>
    );

    let content;
    if (this.state.isQueried) {
      if (this.state.results.length === 0) {
        // loading results
        content = <Results loading={true} />;
      } else {
        // show results
        content = <Results results={this.state.results} />;
      }
    } else {
      // empty search
      content = landingPage;
    }

    return (
      <div>
        <div className="jumbotron">
          <div className="container">
            <Search onSearch={this.inputChanged} onEmpty={this.inputEmptied} />
          </div>
        </div>
        <div className="container">
          {content}
          <hr />
          <Footer />
        </div>
      </div>
    );
  }
}

export default App;
