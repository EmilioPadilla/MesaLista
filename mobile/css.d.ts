// Allow side-effect and module CSS imports (NativeWind / Expo CSS).
declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
