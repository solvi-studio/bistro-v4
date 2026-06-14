// 1. Force the custom schema declaration to load first!
export * from './schema'; 

// 2. Load all individual tables and their relations
export * from './users';
export * from './folders';
export * from './tasks';
export * from './summaries';