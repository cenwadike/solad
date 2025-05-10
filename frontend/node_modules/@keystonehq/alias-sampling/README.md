# Alias Method for Sampling

A JavaScript library for efficient sampling of random values from a discrete probability distribution using the Walker-Vose alias method, provided by KeystoneHQ.

## Installation

Install the library using yarn:

```shell
yarn add @keystonehq/alias-sampling
```

Or npm:

```shell
npm install @keystonehq/alias-sampling
```

## Usage

To use the library, first import the `sample` function and then create a sampler with a given probability distribution and optionally an array of outcomes. You can then generate random samples using the `.next()` method.

### Basic Usage

```javascript
import sample from '@keystonehq/alias-sampling';

// Create a sampler with specified probabilities and outcomes
var s = sample([0.5, 0.25, 0.25], ['A', 'B', 'C']);

// Generate a single random outcome
console.log(s.next()); // => 'A', 'B', or 'C' according to specified probabilities
```

### Generating Multiple Samples

```javascript
import sample from '@keystonehq/alias-sampling';

// Create a sampler with specified probabilities
var s = sample([0.5, 0.25, 0.25], [10, 20, 30]);

// Generate multiple random samples
console.log(s.next(1000)); // => an array of 1000 random samples
```

### Sampling Indices

```javascript
import sample from '@keystonehq/alias-sampling';

// Create a sampler without specifying outcomes (defaults to indices)
var s = sample([0.5, 0.25, 0.25]);

// Generate a single random index
console.log(s.next()); // => 0, 1, or 2 with the specified probabilities
```

### Using a Custom Random Generator

```javascript
import sample from '@keystonehq/alias-sampling';

// Custom random generator function
var rand = Math.random;

// Create a sampler with specified probabilities and custom random generator
var s = sample([0.5, 0.25, 0.25], null, rand);

// Generate a random index using the custom random generator
console.log(s.next()); // => 0, 1, or 2 with the specified probabilities
```
