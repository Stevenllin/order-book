# Order Book - Real-time Cryptocurrency Trading Interface

A real-time cryptocurrency order book application built with Vue 3, TypeScript, and WebSocket technology. This application displays live order book data and trade history for cryptocurrency trading pairs.

## 🚀 Features

- **Real-time Order Book Display**: Live updates of buy/sell orders with price, size, and cumulative totals
- **Trade History**: Real-time trade execution updates with price change indicators
- **WebSocket Integration**: Real-time data streaming from cryptocurrency exchange
- **Modular Architecture**: Separated concerns with dedicated composables for order book and trade history
- **Environment Configuration**: Configurable WebSocket URLs and topics via environment variables
- **Responsive UI**: Clean, modern interface with loading states and visual feedback
- **TypeScript Support**: Full type safety throughout the application
- **Comprehensive Testing**: Unit tests with Vitest and Vue Test Utils

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Frontend**: Vue 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS with modular architecture
- **Testing**: Vitest + Vue Test Utils
- **Real-time**: WebSocket
- **State Management**: Vue 3 reactive system

## 📦 Installation

**Prerequisites:**
- Node.js 20

1. Clone the repository:
```bash
git clone <repository-url>
cd order-book
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
   - Edit `src/config/env.ts` to customize WebSocket URLs and topics
   - Adjust display settings like maximum order book entries

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── assets/
│   ├── styles/          # SCSS styles and themes
│   │   ├── abstracts/   # Mixins and variables
│   │   ├── components/  # Component-specific styles
│   │   └── themes/      # Color and font definitions
│   └── svg/            # SVG icons
├── components/
│   └── UI/             # Reusable UI components
│       ├── Loading.vue
│       └── OrderBookRow.vue
├── config/
│   └── env.ts          # Environment configuration
├── core/
│   ├── composable/     # Vue composables
│   │   ├── useBTSESocket.ts    # WebSocket connection management
│   │   ├── useOrderBook.ts     # Order book data management
│   │   └── useTradeHistory.ts  # Trade history management
│   ├── enums/          # TypeScript enums
│   │   ├── order/      # Order-related enums
│   │   │   ├── OrderBookUpdateType.ts
│   │   │   └── OrderSide.ts
│   │   └── system/     # System enums
│   │       ├── SizeNameEnum.ts
│   │       └── StatusChangeEnum.ts
│   └── services/       # Business logic services
│       ├── commonServices.ts
│       └── orderBookServices.ts
├── types/
│   └── index.ts        # TypeScript type definitions
├── OrderBook.vue       # Main order book component
└── main.ts            # Application entry point
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests in watch mode
- `npm run coverage` - Generate test coverage report

## 📊 Core Features

### Real-time Data Management
- **WebSocket Connection**: Robust connection management with automatic reconnection
- **Order Book Updates**: Handles both snapshot and incremental updates
- **Sequence Number Validation**: Automatically reconnects on data gaps
- **Trade History**: Real-time trade execution updates with proper state management

### Modular Composable Architecture
- **useBTSESocket**: Centralized WebSocket connection management
- **useOrderBook**: Dedicated order book data processing and state management
- **useTradeHistory**: Separate trade history data handling
- **Clean Separation**: Each composable handles its specific domain

### UI Components
- **Loading States**: Skeleton loading and spinner components
- **Order Rows**: Individual order entries with price, size, and totals
- **Price Indicators**: Visual indicators for price changes and new entries
- **Responsive Design**: Works on desktop and mobile devices

## 🧪 Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Core services and utilities
- **Component Tests**: Vue components with mocked dependencies
- **Composable Tests**: Individual composable functionality testing
- **Integration Tests**: WebSocket and data flow testing
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

### WebSocket Configuration
The application connects to cryptocurrency exchange WebSocket endpoints for real-time data streaming. Configuration is centralized in `src/config/env.ts`:

```typescript
export const config = {
  websocket: {
    orderBook: {
      url: 'wss://your-exchange.com/ws/spot',
      topic: 'orderBookApi'
    },
    tradeHistory: {
      url: 'wss://your-exchange.com/ws/spot',
      topic: 'tradeHistoryApi'
    }
  },
  display: {
    maxOrderBookEntries: 20
  }
}
```

### Data Formats
- **Order Book Data**: `{ asks: [price, size][], bids: [price, size][], type, seqNum, prevSeqNum }`
- **Trade Data**: `{ price, side, size, symbol, timestamp, tradeId }`

## 🎨 Styling

The application uses SCSS with a modular structure:
- **Abstracts**: Mixins and variables for consistent styling
- **Components**: Component-specific styles with BEM methodology
- **Themes**: Color and font definitions for easy theming

## 🔄 State Management

The application uses Vue 3's reactive system for state management:
- **Reactive State**: Order book and trade data are reactive
- **Computed Properties**: Derived state for display calculations
- **Lifecycle Management**: Proper cleanup of WebSocket connections

## 🚀 Performance Features

- **Efficient Updates**: Only updates changed data
- **Memory Management**: Proper cleanup of WebSocket connections
- **Optimized Rendering**: Computed properties for expensive calculations

