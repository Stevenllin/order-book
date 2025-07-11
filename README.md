# Order Book - Real-time Cryptocurrency Trading Interface

A real-time cryptocurrency order book application built with Vue 3, TypeScript, and WebSocket technology. This application displays live order book data and trade history for cryptocurrency trading pairs.

## 🚀 Features

- **Real-time Order Book Display**: Live updates of buy/sell orders with price, size, and cumulative totals
- **WebSocket Integration**: Real-time data streaming from cryptocurrency exchange
- **Trade History**: Latest trade information with price change indicators
- **Responsive UI**: Clean, modern interface with loading states
- **TypeScript Support**: Full type safety throughout the application
- **Comprehensive Testing**: Unit tests with Vitest and Vue Test Utils

## 🛠️ Tech Stack

- **Frontend**: Vue 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS
- **Testing**: Vitest + Vue Test Utils
- **Real-time**: WebSocket

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd order-book
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── assets/
│   ├── styles/          # SCSS styles and themes
│   └── svg/            # SVG icons
├── components/
│   └── UI/             # Reusable UI components
│       ├── Loading.vue
│       └── OrderBookRow.vue
├── core/
│   ├── composable/     # Vue composables
│   │   └── useBTSESocket.ts
│   ├── enums/          # TypeScript enums
│   │   ├── order/      # Order-related enums
│   │   └── system/     # System enums
│   └── services/       # Business logic services
│       ├── commonServices.ts
│       └── orderBookServices.ts
├── OrderBook.vue       # Main order book component
└── main.ts            # Application entry point
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests in watch mode
- `npm run coverage` - Generate test coverage report

## 📊 Order Book Features

### Real-time Data
- **WebSocket Connection**: Connects to cryptocurrency exchange for live data
- **Order Book Updates**: Handles both snapshot and incremental updates
- **Sequence Number Validation**: Automatically reconnects on data gaps
- **Trade History**: Real-time trade execution updates

### UI Components
- **Loading States**: Skeleton loading and spinner components
- **Order Rows**: Individual order entries with price, size, and totals
- **Price Indicators**: Visual indicators for price changes
- **Responsive Design**: Works on desktop and mobile devices

### Data Processing
- **Order Processing**: Converts raw data to structured order book entries
- **Cumulative Totals**: Calculates running totals for order sizes
- **Price Sorting**: Maintains proper order book structure (bids descending, asks ascending)
- **Data Validation**: Ensures data integrity and handles edge cases

## 🧪 Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Core services and utilities
- **Component Tests**: Vue components with mocked dependencies
- **Integration Tests**: WebSocket composable functionality
- **Coverage Reports**: Detailed test coverage analysis

Run tests:
```bash
npm test
```

Generate coverage report:
```bash
npm run coverage
```

## 🔌 API Integration

### WebSocket Endpoints
The application connects to cryptocurrency exchange WebSocket endpoints for real-time data streaming.

### Data Formats
- **Order Book Data**: `{ asks: [price, size][], bids: [price, size][], type, seqNum, prevSeqNum }`
- **Trade Data**: `{ price, side, size, symbol, timestamp, tradeId }`

## 🎨 Styling

The application uses SCSS with a modular structure:
- **Abstracts**: Mixins and variables
- **Components**: Component-specific styles
- **Themes**: Color and font definitions
