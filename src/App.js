import './App.css';
import React, { Component } from 'react';

import { API, graphqlOperation } from 'aws-amplify';
import { listRestaurants } from './graphql/queries';

import { createRestaurant } from './graphql/mutations'
import { onCreateRestaurant } from './graphql/subscriptions'


class App extends Component {
  state = { name: '', description: '', restaurants: [] }
  async componentDidMount() {
    try {
      const apiData = await API.graphql(graphqlOperation(listRestaurants))
      const restaurants = apiData.data.listRestaurants.items
      this.setState({ restaurants })
    } catch (err) {
      console.log('error: ', err)
    }
    
    this.subscription = API.graphql(
      graphqlOperation(onCreateRestaurant)
    ).subscribe({
      next: restaurantData => {
        const restaurant = restaurantData.value.data.onCreateRestaurant
        const restaurants = [
          ...this.state.restaurants.filter(r => {
            return (
              r.name !== restaurant.name && r.description !== restaurant.description
            )
          }),
          restaurant 
        ]
        this.setState({ restaurants })
      }
    })
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  onChange = e => {
    this.setState({ [e.target.name ]: e.target.value })
  }
  createRestaurant = async() => {
    const { name, description } = this.state
    if (name === '' || description === '') return
    try {
      const restaurant = { name, description }
      const restaurants = [...this.state.restaurants, restaurant]
      this.setState({ restaurants, name: '', description: '' })
      await API.graphql(graphqlOperation(createRestaurant, {input: restaurant}))
      console.log('restaurant successfully created!')
    } catch (err) {
      console.log('error: ', err)
    }
  }
  render() {
    return (
      <div className="App">
        <div style={styles.inputContainer}>
          <input
            name='name'
            placeholder='restaurant name'
            onChange={this.onChange}
            value={this.state.name}
            style={styles.input}
          />
          <input 
            name='description'
            placeholder='restaurant description'
            onChange={this.onChange}
            value={this.state.description}
            style={styles.input}
          />
        </div>
        <button
          style={styles.button}
          onClick={this.createRestaurant}
        >Create Restaurant</button>
        {
          this.state.restaurants.map((rest, i) => (
            <div key={i} style={styles.item}>
              <p style={styles.name}>{rest.name}</p>
              <p style={styles.description}>{rest.description}</p>
            </div>
          ))
        }
      </div>
    );
  }
}

const styles = {
  inputContainer: {
    margin: '0 auto', display: 'flex', flexDirection: 'column', width: 300
  },
  button: {
    border: 'none', backgroundColor: '#ddd', padding: '10px 30px'
  },
  input: {
    fontSize: 18,
    border: 'none',
    margin: 10,
    height: 35,
    backgroundColor: "#ddd",
    padding: 8
  },
  item: {
    padding: 10,
    borderBottom: '2px solid #ddd'
  },
  name: { fontSize: 22 },
  description: { color: 'rgba(0,0,0,.45)' }
}

export default App;
