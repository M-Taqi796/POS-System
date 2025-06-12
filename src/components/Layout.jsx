import { Fragment, useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, ShoppingCartIcon, HomeIcon, CubeIcon, ClipboardDocumentListIcon, Cog6ToothIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Products', href: '/products', icon: CubeIcon },
  { name: 'Checkout', href: '/checkout', icon: ShoppingCartIcon },
  { name: 'Orders', href: '/orders', icon: ClipboardDocumentListIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({ user, setUser }) {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <Disclosure as="nav" className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 justify-between">
                <div className="flex">
                  <div className="flex flex-shrink-0 items-center">
                    <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>POS System</h1>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          location.pathname === item.href
                            ? darkMode
                              ? 'border-blue-400 text-white'
                              : 'border-blue-500 text-gray-900'
                            : darkMode
                              ? 'border-transparent text-gray-300 hover:border-gray-600 hover:text-white'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                        )}
                      >
                        <item.icon className="h-5 w-5 mr-2" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {darkMode ? (
                      <SunIcon className="h-5 w-5" />
                    ) : (
                      <MoonIcon className="h-5 w-5" />
                    )}
                  </button>
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className={`flex rounded-full ${
                        darkMode ? 'bg-gray-700' : 'bg-white'
                      } text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}>
                        <span className="sr-only">Open user menu</span>
                        <div className={`h-8 w-8 rounded-full ${
                          darkMode ? 'bg-gray-600' : 'bg-gray-200'
                        } flex items-center justify-center ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className={`absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      } py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => setUser(null)}
                              className={classNames(
                                active ? darkMode ? 'bg-gray-700' : 'bg-gray-100' : '',
                                `block w-full px-4 py-2 text-left text-sm ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
                <div className="-mr-2 flex items-center sm:hidden">
                  <Disclosure.Button className={`inline-flex items-center justify-center rounded-md p-2 ${
                    darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`}>
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 pb-3 pt-2">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    to={item.href}
                    className={classNames(
                      location.pathname === item.href
                        ? darkMode
                          ? 'bg-gray-700 border-blue-400 text-white'
                          : 'bg-blue-50 border-blue-500 text-blue-700'
                        : darkMode
                          ? 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-white'
                          : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                      'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </div>
                  </Disclosure.Button>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <div className="py-10">
        <main>
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className={darkMode ? 'dark' : ''}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 