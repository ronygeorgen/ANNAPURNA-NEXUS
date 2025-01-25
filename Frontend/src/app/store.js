import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '../features/auth/authSlice';
import profileReducer from '../features/sub-admin-profile/profileSlice'
import dashboardReducer from '../features/sub-admin-dashboard/dashboardSlice'
import shopsReducer from '../features/fetch-nearbyshop-home/shopsSlice'

// Auth persist config
const persistConfig = {
    key: 'auth',
    storage,
    whitelist: ['user', 'isAuthenticated']
  };

const profilePersistConfig = {
    key: 'profile',
    storage,
    whitelist: ['data']
}
const dashboardPersistConfig = {
    key: 'dashboard',
    storage,
    whitelist: ['metrics']
}

const shopsHomePersistConfig = {
    key: 'shops',
    storage,
    whitelist: ['shops']
}

// Create persisted reducers
const persistedReducer = persistReducer(persistConfig, authReducer);
const persistedProfileReducer = persistReducer(profilePersistConfig, profileReducer);
const persistedashboardReducer = persistReducer(dashboardPersistConfig, dashboardReducer);
const persistedShopsHomedReducer = persistReducer(shopsHomePersistConfig, shopsReducer);

const rootReducers = combineReducers({
    auth: persistedReducer,
    profile: persistedProfileReducer,
    dashboard: persistedashboardReducer,
    shops: persistedShopsHomedReducer,
});

export  const store = configureStore({
    reducer: rootReducers,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);