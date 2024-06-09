import { useState } from 'react';
import './App.less';

import TestClass from '@/components/TestClass';
import { LazyDemo } from '@/lazyComponents/index';
import Footer from '@/components/Footer'

import { isDev, DateFormat } from '@/utils/index';

console.log('process.env.NODE_ENV', process.env.NODE_ENV);

// 哈哈哈
function App() {
  const [lazyShow, setLazyShow] = useState(false);

  // 点击事件中动态引入css, 设置show为true
  const onClick = () => {
    //import('./app.css');
    setLazyShow(true);
  };

  return (
    <>
    <div className='box'>
    <button onClick={onClick}>lazyShow</button>
      {lazyShow && <LazyDemo></LazyDemo>}
      <h2>222webpack22225222-react-tswwssddd {isDev()}</h2>
      <h3>{DateFormat()}</h3>
      <TestClass></TestClass>
    </div>
      
      <Footer></Footer>
    </>
  );
}
export default App;
