TITLE: Tailwind CSS Peer-Has-Checked To-Do List Example
DESCRIPTION: This comprehensive HTML snippet demonstrates a to-do list interface where an SVG icon (representing a delete button) is conditionally hidden when its sibling's descendant (a checkbox input) is checked. It utilizes the `peer` class on the label and `peer-has-checked:hidden` on the SVG's parent div to achieve this dynamic styling.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_12

LANGUAGE: HTML
CODE:
```
<div className="mx-auto max-w-md border-x border-x-gray-200 px-4 py-6 dark:border-x-gray-800 dark:bg-gray-950/10">
      <fieldset className="space-y-3">
        <legend className="text-base font-semibold text-gray-900 dark:text-white">Today</legend>
        <div className="grid grid-cols-[1fr_24px] items-center gap-6">
          <label className="peer grid grid-cols-[auto_1fr] items-center gap-3 rounded-md px-2 hover:bg-gray-100 dark:hover:bg-white/5">
            <input
              type="checkbox"
              className="peer size-3.5 appearance-none rounded-sm border border-gray-300 accent-pink-500 checked:appearance-auto dark:border-gray-600 dark:accent-pink-600"
              defaultChecked
            />
            <span className="text-gray-700 select-none peer-checked:text-gray-400 peer-checked:line-through dark:text-gray-300">
              Create a to do list
            </span>
          </label>
          <div className="size-[26px] rounded-md p-1 peer-has-checked:hidden hover:bg-red-50 hover:text-pink-500">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_24px] items-center gap-6">
          <label className="peer grid grid-cols-[auto_1fr] items-center gap-3 rounded-md px-2 hover:bg-gray-100 dark:hover:bg-white/5">
            <input
              type="checkbox"
              className="peer size-3.5 appearance-none rounded-sm border border-gray-300 accent-pink-500 checked:appearance-auto dark:border-gray-600 dark:accent-pink-600"
            />
            <span className="text-gray-700 select-none peer-checked:text-gray-400 peer-checked:line-through dark:text-gray-300">
              Check off first item
            </span>
          </label>
          <div className="size-[26px] rounded-md p-1 peer-has-checked:hidden hover:bg-red-50 hover:text-pink-500">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_24px] items-center gap-6">
          <label className="peer grid grid-cols-[auto_1fr] items-center gap-3 rounded-md px-2 hover:bg-gray-100 dark:hover:bg-white/5">
            <input
              type="checkbox"
              className="peer size-3.5 appearance-none rounded-sm border border-gray-300 accent-pink-500 checked:appearance-auto dark:border-gray-600 dark:accent-pink-600"
            />
            <span className="text-gray-700 select-none peer-checked:text-gray-400 peer-checked:line-through dark:text-gray-300">
              Investigate race condition
            </span>
          </label>
          <div className="block size-[26px] rounded-md p-1 peer-has-checked:hidden hover:bg-red-50 hover:text-pink-500">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </fieldset>
    </div>
```

----------------------------------------

TITLE: Stacking Multiple Tailwind CSS Variants
DESCRIPTION: Illustrates how to combine multiple Tailwind CSS variants, such as dark mode, responsive breakpoints, and hover states, to target highly specific design conditions.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_1

LANGUAGE: html
CODE:
```
<!-- [!code classes:dark:md:hover:bg-fuchsia-600] -->
<button class="dark:md:hover:bg-fuchsia-600 ...">Save changes</button>
```

----------------------------------------

TITLE: Basic Flex Item Growth and Shrink Example
DESCRIPTION: Demonstrates how `flex-1` allows a flex item to grow and shrink as needed, ignoring its initial size. Examples are provided in both React JSX and plain HTML.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/flex.mdx#_snippet_1

LANGUAGE: jsx
CODE:
```
<div className="grid grid-cols-1">
  <Stripes border className="col-start-1 row-start-1 rounded-lg" />
  <div className="col-start-1 row-start-1 flex gap-4 rounded-lg font-mono text-sm leading-6 font-bold text-white">
    <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-pink-300 p-4 dark:bg-pink-800 dark:text-pink-400">
      01
    </div>
    <div className="flex w-64 flex-1 items-center justify-center rounded-lg bg-pink-500 p-4">02</div>
    <div className="flex w-32 flex-1 items-center justify-center rounded-lg bg-pink-500 p-4">03</div>
  </div>
</div>
```

LANGUAGE: html
CODE:
```
<!-- [!code word:flex-1] -->
<div class="flex">
  <div class="w-14 flex-none ...">01</div>
  <div class="w-64 flex-1 ...">02</div>
  <div class="w-32 flex-1 ...">03</div>
</div>
```

----------------------------------------

TITLE: Target parent/sibling elements with group-aria variants
DESCRIPTION: Illustrates the use of `group-aria-*` variants in Tailwind CSS to apply styles to child elements based on the ARIA state of a parent element. This enables complex styling relationships within a component, such as rotating an SVG icon based on the `aria-sort` state of its parent table header.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_65

LANGUAGE: HTML
CODE:
```
<!-- [!code classes:group-aria-[sort=ascending]:rotate-0,group-aria-[sort=descending]:rotate-180] -->
<table>
  <thead>
    <tr>
    <th aria-sort="ascending" class="group">
      Invoice #
      <svg class="group-aria-[sort=ascending]:rotate-0 group-aria-[sort=descending]:rotate-180"><!-- ... --></svg>
    </th>
    <!-- ... -->
    </tr>
  </thead>
  <!-- ... -->
</table>
```

LANGUAGE: CSS
CODE:
```
.group-aria-\[sort\=ascending\]\:rotate-0 {
  &:is(:where(.group)[aria-sort="ascending"] *) {
    rotate: 0deg;
  }
}
.group-aria-\[sort\=descending\]\:rotate-180 {
  &:is(:where(.group)[aria-sort="descending"] *) {
    rotate: 180deg;
  }
}
```

----------------------------------------

TITLE: Building a Responsive Component with Tailwind Utility Classes
DESCRIPTION: This example demonstrates a fully responsive UI component built entirely with Tailwind CSS utility classes. It showcases how to apply styles for different screen sizes, as well as interactive states like hover and active, without writing custom CSS.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/styling-with-utility-classes.mdx#_snippet_2

LANGUAGE: jsx
CODE:
```
<div className="mx-auto max-w-sm space-y-2 rounded-xl bg-white px-8 py-8 shadow-lg ring ring-black/5 @sm:flex @sm:items-center @sm:space-y-0 @sm:gap-x-6 @sm:py-4">
      <img
        className="mx-auto block h-24 rounded-full @sm:mx-0 @sm:shrink-0"
        src={erinLindford.src}
        alt="Woman's Face"
      />
      <div className="space-y-2 text-center @sm:text-left">
        <div className="space-y-0.5">
          <p className="text-lg font-semibold text-black">Erin Lindford</p>
          <p className="font-medium text-gray-500">Product Engineer</p>
        </div>
        <button className="rounded-full border border-purple-200 px-4 py-1 text-sm font-semibold text-purple-600 hover:border-transparent hover:bg-purple-600 hover:text-white active:bg-purple-700">
          Message
        </button>
      </div>
    </div>
```

LANGUAGE: html
CODE:
```
<!-- [!code classes:sm:flex-row,sm:py-4,sm:gap-6,sm:mx-0,sm:shrink-0,sm:text-left,sm:items-center] -->
<!-- [!code classes:hover:text-white,hover:bg-purple-600,hover:border-transparent,active:bg-purple-700] -->
<div class="flex flex-col gap-2 p-8 sm:flex-row sm:items-center sm:gap-6 sm:py-4 ...">
  <img class="mx-auto block h-24 rounded-full sm:mx-0 sm:shrink-0" src="/img/erin-lindford.jpg" alt="" />
  <div class="space-y-2 text-center sm:text-left">
    <div class="space-y-0.5">
      <p class="text-lg font-semibold text-black">Erin Lindford</p>
      <p class="font-medium text-gray-500">Product Engineer</p>
    </div>
    <!-- prettier-ignore -->
    <button class="border-purple-200 text-purple-600 hover:border-transparent hover:bg-purple-600 hover:text-white active:bg-purple-700 ...">
      Message
    </button>
  </div>
</div>
```

----------------------------------------

TITLE: Apply Hover Styles with Tailwind CSS
DESCRIPTION: Styles an element when the user's mouse cursor hovers over it. This variant is commonly used for interactive elements like buttons or links to provide visual feedback.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_193

LANGUAGE: HTML
CODE:
```
<div class="bg-black hover:bg-white ...">
  <!-- ... -->
</div>
```

----------------------------------------

TITLE: HTML Example of Tailwind CSS Color Utilities
DESCRIPTION: This HTML snippet showcases the direct application of Tailwind CSS color utility classes for background, border, text, and outline properties, demonstrating a notification card layout with dark mode support.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/colors.mdx#_snippet_2

LANGUAGE: html
CODE:
```
<!-- [!code classes:bg-white,border-pink-300,bg-pink-100,stroke-pink-700,text-gray-950,text-gray-500,outline-black/5,text-gray-700,dark:bg-gray-800,dark:border-pink-300/10,dark:bg-pink-400/10,dark:stroke-pink-500,dark:text-gray-400,dark:text-white] -->
<div class="flex items-center gap-4 rounded-lg bg-white p-6 shadow-md outline outline-black/5 dark:bg-gray-800">
  <!-- prettier-ignore -->
  <span class="inline-flex shrink-0 rounded-full border border-pink-300 bg-pink-100 p-2 dark:border-pink-300/10 dark:bg-pink-400/10">
    <svg class="size-6 stroke-pink-700 dark:stroke-pink-500"><!-- ... --></svg>
  </span>
  <div>
    <p class="text-gray-700 dark:text-gray-400">
      <span class="font-medium text-gray-950 dark:text-white">Tom Watson</span> mentioned you in
      <span class="font-medium text-gray-950 dark:text-white">Logo redesign</span>
    </p>
    <time class="mt-1 block text-gray-500" datetime="9:37">9:37am</time>
  </div>
</div>
```

----------------------------------------

TITLE: Tailwind CSS: Generic data attribute selector
DESCRIPTION: Applies styles based on any custom data attribute, using the `&[data-...]` selector for flexible styling based on data states.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_188

LANGUAGE: CSS
CODE:
```
&[data-...]
```

----------------------------------------

TITLE: Tailwind CSS Variant: has-[...]
DESCRIPTION: CSS equivalent for the Tailwind CSS `has-[...]` variant, applying styles to an element if it contains a specific selector.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_91

LANGUAGE: css
CODE:
```
&:has(...)
```

----------------------------------------

TITLE: Tailwind CSS Card Component Example (HTML)
DESCRIPTION: A standard HTML example demonstrating a UI card component styled entirely with Tailwind CSS utility classes. It features an image, text content, and showcases the direct application of utility classes for layout and appearance.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/styling-with-utility-classes.mdx#_snippet_1

LANGUAGE: html
CODE:
```
<!-- prettier-ignore -->
<div class="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
  <img class="size-12 shrink-0" src="/img/logo.svg" alt="ChitChat Logo" />
  <div>
    <div class="text-xl font-medium text-black dark:text-white">ChitChat</div>
    <p class="text-gray-500 dark:text-gray-400">You have a new message!</p>
  </div>
</div>
```

----------------------------------------

TITLE: Apply Tailwind CSS :first and :last variants to list items
DESCRIPTION: This snippet demonstrates how to use Tailwind CSS's `first:pt-0` and `last:pb-0` variants to remove top padding from the first list item and bottom padding from the last list item in a `ul` element. This is useful for creating clean, continuous lists where the first and last items don't have extra spacing at their edges.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_3

LANGUAGE: HTML
CODE:
```
<div className="px-4">
  <div className="mx-auto max-w-md border-x border-x-gray-200 dark:border-x-gray-800 dark:bg-gray-950/10">
    <ul role="list" className="divide-y divide-gray-200 p-6 dark:divide-gray-800">
      <li className="flex py-4 first:pt-0 last:pb-0">
        <img
          className="h-10 w-10 rounded-full"
          src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt=""
        />
        <div className="ml-3 overflow-hidden">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Kristen Ramos</p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">kristen.ramos@example.com</p>
        </div>
      </li>
      <li className="flex py-4 first:pt-0 last:pb-0">
        <img
          className="h-10 w-10 rounded-full"
          src="https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt=""
        />
        <div className="ml-3 overflow-hidden">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Floyd Miles</p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">floyd.miles@example.com</p>
        </div>
      </li>
      <li className="flex py-4 first:pt-0 last:pb-0">
        <img
          className="h-10 w-10 rounded-full"
          src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt=""
        />
        <div className="ml-3 overflow-hidden">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Courtney Henry</p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">courtney.henry@example.com</p>
        </div>
      </li>
      <li className="flex py-4 first:pt-0 last:pb-0">
        <img
          className="h-10 w-10 rounded-full"
          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt=""
        />
        <div className="ml-3 overflow-hidden">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Ted Fox</p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">ted.fox@example.com</p>
        </div>
      </li>
    </ul>
  </div>
</div>
```

LANGUAGE: Svelte
CODE:
```
<!-- [!code classes:first:pt-0,last:pb-0] -->
<ul role="list">
  {#each people as person}
    <!-- Remove top/bottom padding when first/last child -->
    <li class="flex py-4 first:pt-0 last:pb-0">
      <img class="h-10 w-10 rounded-full" src={person.imageUrl} alt="" />
      <div class="ml-3 overflow-hidden">
        <p class="text-sm font-medium text-gray-900 dark:text-white">{person.name}</p>
        <p class="truncate text-sm text-gray-500 dark:text-gray-400">{person.email}</p>
      </div>
    </li>
  {/each}
</ul>
```

----------------------------------------

TITLE: Align Flex Items to Stretch (items-stretch)
DESCRIPTION: Demonstrates how to use the `items-stretch` utility to make flex items stretch to fill the container's cross axis. Includes both JSX (React) and plain HTML examples.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/align-items.mdx#_snippet_1

LANGUAGE: jsx
CODE:
```
<div className="grid grid-cols-1">
  <Stripes border className="col-start-1 row-start-1 rounded-lg" />
  <div className="col-start-1 row-start-1 flex w-full items-stretch gap-4 rounded-lg text-center font-mono text-sm leading-6 font-bold text-white">
    <div className="flex flex-1 items-center justify-center rounded-lg bg-cyan-500 py-4">01</div>
    <div className="flex flex-1 items-center justify-center rounded-lg bg-cyan-500 py-12">02</div>
    <div className="flex flex-1 items-center justify-center rounded-lg bg-cyan-500 py-8">03</div>
  </div>
</div>
```

LANGUAGE: html
CODE:
```
<!-- [!code classes:items-stretch] -->
<div class="flex items-stretch ...">
  <div class="py-4">01</div>
  <div class="py-12">02</div>
  <div class="py-8">03</div>
</div>
```

----------------------------------------

TITLE: Styling Descendants with group-has-* in React/JSX
DESCRIPTION: Demonstrates how to apply styles to an element based on the presence of a specific descendant within a parent element marked with the `group` class, using the `group-has-[selector]:` variant in Tailwind CSS. This example shows a user list where an SVG icon appears only if a link (`<a>`) is present in the user's description.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_10

LANGUAGE: jsx
CODE:
```
<div className="mx-auto grid max-w-md divide-y divide-gray-100 border-x border-x-gray-200 text-gray-700 dark:divide-gray-800 dark:border-x-gray-800 dark:bg-gray-950/10 dark:text-gray-300">
  <div className="group grid grid-cols-[32px_1fr_auto] items-center gap-x-4 px-4 py-4 pt-6">
    <img
      className="size-[32px] rounded-full"
      src="https://spotlight.tailwindui.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Favatar.51a13c67.jpg&w=128&q=80"
      alt=""
    />
    {/* This is not an h4 because we're converting h4's to links in MDX files */}
    <div className="font-semibold text-gray-900 dark:text-white">Spencer Sharp</div>
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="hidden size-4 group-has-[a]:block"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
    <p className="col-start-2 text-sm">
      Product Designer at{" "}
      <a href="#" className="dark;text-blue-400 text-blue-500 underline">
        planeteria.tech
      </a>
    </p>
  </div>
  <div className="group grid grid-cols-[32px_1fr_auto] items-center gap-x-4 px-4 py-4">
    <img
      className="size-[32px] rounded-full"
      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&h=256&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      alt=""
    />
    {/* This is not an h4 because we're converting h4's to links in MDX files */}
    <div className="font-semibold text-gray-900 dark:text-white">Casey Jordan</div>
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="hidden size-4 group-has-[a]:block"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
    <p className="col-start-2 text-sm">Just happy to be here.</p>
  </div>
  <div className="group grid grid-cols-[32px_1fr_auto] items-center gap-x-4 px-4 py-4">
    <img
      className="size-[32px] rounded-full"
      src="https://images.unsplash.com/photo-1590895340509-793cb98788c9?q=80&w=256&h=256&&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      alt=""
    />
    {/* This is not an h4 because we're converting h4's to links in MDX files */}
    <div className="font-semibold text-gray-900 dark:text-white">Alex Reed</div>
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="hidden size-4 group-has-[a]:block"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
    <p className="col-start-2 text-sm">
      A multidisciplinary designer, working at the intersection of art and technology. <br />
      <br />
      <a href="#" className="dark;text-blue-400 text-blue-500 underline">
        alex-reed.com
      </a>
    </p>
  </div>
  <div className="group grid grid-cols-[32px_1fr_auto] items-center gap-x-4 px-4 py-4 pb-6">
    <img
      className="size-[32px] rounded-full"
      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&h=256&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      alt=""
    />
    {/* This is not an h4 because we're converting h4's to links in MDX files */}
    <div className="font-semibold text-gray-900 dark:text-white">Taylor Bailey</div>
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="hidden size-4 group-has-[a]:block"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
    <p className="col-start-2 text-sm">Pushing pixels. Slinging divs.</p>
  </div>
</div>
```

----------------------------------------

TITLE: Define Custom Tailwind CSS ARIA Variants
DESCRIPTION: Shows how to create new custom `aria-*` variants in Tailwind CSS using the `@custom-variant` directive for specific ARIA attributes like `aria-sort`.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_62

LANGUAGE: CSS
CODE:
```
@custom-variant aria-asc (&[aria-sort="ascending"]);
@custom-variant aria-desc (&[aria-sort="descending"]);
```

----------------------------------------

TITLE: Style child elements based on parent state using Tailwind CSS `group-*` variants
DESCRIPTION: Describes how to use the `group` class on a parent element and `group-*` variants (e.g., `group-hover`) on child elements to apply styles based on the parent's state. It illustrates with an example where hovering over a card changes the color of text and an SVG inside it. This pattern works with every pseudo-class variant, such as `group-focus` or `group-active`.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_15

LANGUAGE: jsx
CODE:
```
<a
  href="#"
  className="group mx-auto block max-w-xs space-y-3 rounded-lg bg-white p-4 shadow-lg ring-1 ring-gray-900/5 hover:bg-sky-500 hover:ring-sky-500 dark:bg-white/5 dark:ring-white/10"
>
  <div className="flex items-center space-x-3">
    <svg className="h-6 w-6 stroke-sky-500 group-hover:stroke-white" fill="none" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11 19H6.931A1.922 1.922 0 015 17.087V8h12.069C18.135 8 19 8.857 19 9.913V11"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M14 7.64L13.042 6c-.36-.616-1.053-1-1.806-1H7.057C5.921 5 5 5.86 5 6.92V11M17 15v4M19 17h-4"
      />
    </svg>
    <div className="text-sm font-semibold text-gray-900 group-hover:text-white dark:text-white">New project</div>
  </div>
  <p className="text-sm text-gray-500 group-hover:text-white dark:text-gray-400">
    Create a new project from a variety of starting templates.
  </p>
</a>
```

LANGUAGE: html
CODE:
```
<!-- [!code classes:group-hover:stroke-white] -->
<!-- [!code classes:group-hover:text-white] -->
<!-- [!code classes:group-hover:text-white] -->
<!-- [!code classes:group] -->
<a href="#" class="group ...">
  <div>
    <svg class="stroke-sky-500 group-hover:stroke-white ..." fill="none" viewBox="0 0 24 24">
      <!-- ... -->
    </svg>
    <h3 class="text-gray-900 group-hover:text-white ...">New project</h3>
  </div>
  <p class="text-gray-500 group-hover:text-white ...">Create a new project from a variety of starting templates.</p>
</a>
```

----------------------------------------

TITLE: Style input when autofilled with :autofill
DESCRIPTION: Applies styles to an input element when it has been automatically filled by the browser's autofill feature using the `autofill` variant. This can help visually distinguish autofilled fields.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_228

LANGUAGE: html
CODE:
```
<!-- [!code classes:autofill:bg-yellow-200] -->
<input class="autofill:bg-yellow-200 ..." />
```

----------------------------------------

TITLE: Correct Dynamic Class Name Mapping with Props in JSX
DESCRIPTION: Demonstrates the recommended way to handle dynamic class names in JSX by mapping props to complete, static class names. This ensures Tailwind CSS can detect and generate all necessary styles during the build process, improving reliability.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/detecting-classes-in-source-files.mdx#_snippet_4

LANGUAGE: jsx
CODE:
```
function Button({ color, children }) {
  const colorVariants = {
    blue: "bg-blue-600 hover:bg-blue-500",
    red: "bg-red-600 hover:bg-red-500",
  };

  return <button className={`${colorVariants[color]} ...`}>{children}</button>;
}
```

----------------------------------------

TITLE: Tailwind CSS Dark Mode Example with prefers-color-scheme in JSX
DESCRIPTION: This JSX snippet demonstrates a UI component styled with Tailwind CSS, showcasing how to apply different visual themes for light and dark modes. It uses the `dark:` variant to provide specific styles that activate when the user's system prefers a dark color scheme, illustrating the visual difference between the two modes.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_38

LANGUAGE: JSX
CODE:
```
<div className="grid grid-cols-1 sm:grid-cols-2">
  <div className="p-8 pt-7">
    <p className="mb-2 text-sm font-medium text-gray-500">Light mode</p>
    <div className="rounded-lg bg-white px-6 py-8 shadow-xl ring-1 ring-gray-900/5">
      <div>
        <span className="inline-flex items-center justify-center rounded-md bg-indigo-500 p-2 shadow-lg">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </span>
      </div>
      {/* This is not an h3 because we're converting h3's to links in MDX files */}
      <div className="mt-5 text-base font-medium tracking-tight text-gray-900">Writes upside-down</div>
      <p className="mt-2 text-sm text-gray-500">
        The Zero Gravity Pen can be used to write in any orientation, including upside-down. It even works in outer
        space.
      </p>
    </div>
  </div>
  <div className="border-l border-l-transparent bg-black/90 p-8 pt-7 dark:border-l-white/10 dark:bg-transparent">
    <p className="mb-2 text-sm font-medium text-gray-400">Dark mode</p>
    <div className="rounded-lg bg-gray-800 px-6 py-8 shadow-xl ring-1 ring-gray-900/5">
      <div>
        <span className="inline-flex items-center justify-center rounded-md bg-indigo-500 p-2 shadow-lg">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </span>
      </div>
      {/* This is not an h3 because we're converting h3's to links in MDX files */}
      <div className="mt-5 text-base font-medium tracking-tight text-white">Writes upside-down</div>
      <p className="mt-2 text-sm text-gray-400">
        The Zero Gravity Pen can be used to write in any orientation, including upside-down. It even works in outer
        space.
      </p>
    </div>
  </div>
</div>
```

----------------------------------------

TITLE: Styling Parent with `has-checked` in Tailwind CSS
DESCRIPTION: This HTML snippet demonstrates how to use the `has-checked` utility class in Tailwind CSS to style a `<label>` element when its descendant `<input type="radio">` is checked. The `has-checked` class applies specific background, text, and ring styles to the parent label based on the radio button's state, supporting both light and dark modes.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_9

LANGUAGE: HTML
CODE:
```
<label
  class="has-checked:bg-indigo-50 has-checked:text-indigo-900 has-checked:ring-indigo-200 dark:has-checked:bg-indigo-950 dark:has-checked:text-indigo-200 dark:has-checked:ring-indigo-900 ..."
>
  <svg fill="currentColor">
    <!-- ... -->
  </svg>
  Google Pay
  <input type="radio" class="checked:border-indigo-500 ..." />
</label>
```

----------------------------------------

TITLE: Tailwind CSS Variant: hover
DESCRIPTION: CSS equivalent for the Tailwind CSS `hover` variant, applying styles when an element is hovered over.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_82

LANGUAGE: css
CODE:
```
@media (hover: hover) { &:hover }
```

----------------------------------------

TITLE: Simplified Tailwind CSS Peer-Has-Checked Syntax
DESCRIPTION: This concise HTML snippet demonstrates the core usage of the `peer` class and `peer-has-checked:hidden` variant. It shows how a sibling element (an SVG icon) can be hidden when a checkbox nested within a `peer` labeled element is checked.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_13

LANGUAGE: HTML
CODE:
```
<!-- [!code classes:peer-has-checked:hidden,peer] -->
<div>
  <label class="peer ...">
    <input type="checkbox" name="todo[1]" checked />
    Create a to do list
  </label>
  <svg class="peer-has-checked:hidden ..."><!-- ... --></svg>
</div>
```

----------------------------------------

TITLE: Customizing Tailwind's Theme with @theme Directive
DESCRIPTION: Demonstrates how to extend or override Tailwind's default design tokens like fonts, breakpoints, colors, and easing functions using the `@theme` directive in CSS. This allows for global customization of the design system.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/adding-custom-styles.mdx#_snippet_0

LANGUAGE: css
CODE:
```
@theme {
  --font-display: "Satoshi", "sans-serif";

  --breakpoint-3xl: 120rem;

  --color-avocado-100: oklch(0.99 0 0);
  --color-avocado-200: oklch(0.98 0.04 113.22);
  --color-avocado-300: oklch(0.94 0.11 115.03);
  --color-avocado-400: oklch(0.92 0.19 114.08);
  --color-avocado-500: oklch(0.84 0.18 117.33);
  --color-avocado-600: oklch(0.53 0.12 118.34);

  --ease-fluid: cubic-bezier(0.3, 0, 0, 1);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);

  /* ... */
}
```

----------------------------------------

TITLE: Improve Paragraph Readability with Tailwind CSS `text-pretty` Utility
DESCRIPTION: Shows the `text-pretty` utility, which applies `text-wrap: pretty` to avoid orphaned words at the end of paragraphs, enhancing the visual appeal and readability of long-form text. This utility provides a subtle but effective improvement for text layout, demonstrated with both raw HTML and React/JSX.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/blog/tailwindcss-v3-4/index.mdx#_snippet_11

LANGUAGE: HTML
CODE:
```
<!-- [!code word:text-pretty] -->
<article class="text-pretty ...">
  <h3>Beloved Manhattan soup stand closes<h3>
  <p>New Yorkers are facing the winter chill...</p>
</article>
```

LANGUAGE: JavaScript
CODE:
```
<div className="mx-auto grid max-w-sm gap-4 bg-white p-8 text-pretty text-slate-700 shadow-xl dark:bg-slate-800 dark:text-slate-400">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Beloved Manhattan soup stand closes</h3>
        <p className="text-sm/6">
          New Yorkers are facing the winter chill with less warmth this year as the city's most revered soup stand
          unexpectedly shutters, following a series of events that have left the community puzzled.
        </p>
      </div>
```

----------------------------------------

TITLE: Tailwind CSS `first-of-type` Utility to CSS `&:first-of-type`
DESCRIPTION: Documents the mapping of the Tailwind CSS `first-of-type` utility to its corresponding native CSS `&:first-of-type` pseudo-class selector. This selector applies styles to the first element of its specific type among siblings.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_102

LANGUAGE: CSS
CODE:
```
&:first-of-type
```

----------------------------------------

TITLE: Conditional Child Layout Styling with Tailwind's * Variant and Data Attributes in React/JSX
DESCRIPTION: This React/JSX snippet showcases an advanced application of Tailwind's `*` variant, combined with data attributes, to conditionally apply layout styles to specific children. The `data-[slot=description]:*:mt-4` class on a parent `<div>` targets only direct children with `data-slot="description"`, enabling precise styling without deeply nesting classes.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/blog/tailwindcss-v3-4/index.mdx#_snippet_8

LANGUAGE: jsx
CODE:
```
function Field({ children }) {
  return (
    <div className="data-[slot=description]:*:mt-4 ...">
      {children}
    </div>
  )
}

function Description({ children }) {
  return (
    <p data-slot="description" ...>{children}</p>
  )
}

function Example() {
  return (
    <Field>
      <Label>First name</Label>
      <Input />
      <Description>Please tell me you know your own name.</Description>
    </Field>
  )
}
```

----------------------------------------

TITLE: Apply Tailwind CSS classes based on ARIA state
DESCRIPTION: Demonstrates how to use ARIA state variants in Tailwind CSS to apply styles directly to an element based on its ARIA attributes, such as `aria-sort` for table headers. This allows for dynamic styling without JavaScript.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_64

LANGUAGE: HTML
CODE:
```
<!-- [!code classes:aria-[sort=ascending]:bg-[url('/img/down-arrow.svg')],aria-[sort=descending]:bg-[url('/img/up-arrow.svg')]] -->
<table>
  <thead>
    <tr>
      <th
        aria-sort="ascending"
        class="aria-[sort=ascending]:bg-[url('/img/down-arrow.svg')] aria-[sort=descending]:bg-[url('/img/up-arrow.svg')]"
      >
        Invoice #
      </th>
      <!-- ... -->
    </tr>
  </thead>
  <!-- ... -->
</table>
```

LANGUAGE: CSS
CODE:
```
.aria-\[sort\=ascending\]\:bg-\[url\(\'\/img\/down-arrow\.svg\'\)\] {
  &[aria-sort="ascending"] {
    background-image: url('/img/down-arrow.svg');
  }
}
.aria-\[sort\=descending\]\:bg-\[url\(\'\/img\/up-arrow\.svg\'\)\] {
  &[aria-sort="descending"] {
    background-image: url('/img/up-arrow.svg');
  }
}
```

----------------------------------------

TITLE: Tailwind CSS Utility for :in-range
DESCRIPTION: Applies styles to input elements (like number or date inputs) whose current value falls within the specified min and max attributes. Useful for providing visual feedback for range validation.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_117

LANGUAGE: CSS
CODE:
```
&:in-range
```

----------------------------------------

TITLE: Tailwind CSS: aria-required selector
DESCRIPTION: Applies styles when an element has the ARIA required state set to true, using the `&[aria-required="true"]` selector.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_185

LANGUAGE: CSS
CODE:
```
&[aria-required="true"]
```

----------------------------------------

TITLE: Tailwind CSS Variant for ::after Pseudo-element
DESCRIPTION: Applies styles to the ::after pseudo-element of an element. This allows adding content or styling after the actual content of an element, similar to ::before for post-content additions.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_125

LANGUAGE: Tailwind CSS
CODE:
```
&::after
```

----------------------------------------

TITLE: Order Flex/Grid Items First or Last
DESCRIPTION: Illustrates using `order-first` and `order-last` utilities to position specific flex or grid items at the beginning or end of the layout, regardless of their original position. Examples are provided for both HTML and JSX contexts.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/order.mdx#_snippet_2

LANGUAGE: jsx
CODE:
```
<div className="flex justify-between font-mono text-sm leading-6 font-bold text-white">
  <div className="order-last flex h-14 w-14 items-center justify-center rounded-lg bg-fuchsia-500">01</div>
  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-fuchsia-500">02</div>
  <div className="order-first flex h-14 w-14 items-center justify-center rounded-lg bg-fuchsia-500">03</div>
</div>
```

LANGUAGE: html
CODE:
```
<!-- [!code classes:order-first,order-last] -->
<div class="flex justify-between ...">
  <div class="order-last ...">01</div>
  <div class="...">02</div>
  <div class="order-first ...">03</div>
</div>
```

----------------------------------------

TITLE: Apply Focus Styles with Tailwind CSS
DESCRIPTION: Styles an element when it receives keyboard or programmatic focus. This is crucial for accessibility, highlighting interactive elements like input fields or buttons when they are active.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_194

LANGUAGE: HTML
CODE:
```
<input class="border-gray-300 focus:border-blue-400 ..." />
```

----------------------------------------

TITLE: Tailwind CSS `odd` Utility to CSS `&:nth-child(odd)`
DESCRIPTION: Documents the mapping of the Tailwind CSS `odd` utility to its corresponding native CSS `&:nth-child(odd)` pseudo-class selector. This selector applies styles to odd-numbered child elements within their parent.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_100

LANGUAGE: CSS
CODE:
```
&:nth-child(odd)
```

----------------------------------------

TITLE: Apply Visited Link Styles with Tailwind CSS
DESCRIPTION: Styles a link element that has already been visited by the user. This variant helps users distinguish between new and previously accessed links, improving navigation experience.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_198

LANGUAGE: HTML
CODE:
```
<a href="https://seinfeldquotes.com" class="text-blue-600 visited:text-purple-600 ..."> Inspiration </a>
```

----------------------------------------

TITLE: Styling Form Elements with Tailwind CSS
DESCRIPTION: Demonstrates how to apply Tailwind CSS classes to a radio button label for styling based on checked state, focus, and pointer type, including responsive adjustments for coarse pointers.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_48

LANGUAGE: HTML
CODE:
```
<label className="flex items-center justify-center rounded-md bg-white p-2 text-sm font-semibold text-gray-900 uppercase ring-1 ring-gray-300 not-data-focus:not-has-checked:ring-inset hover:bg-gray-50 has-checked:bg-indigo-600 has-checked:text-white has-checked:ring-0 has-checked:hover:bg-indigo-500 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-indigo-600 data-focus:ring-2 data-focus:ring-indigo-600 data-focus:ring-offset-2 data-focus:has-checked:ring-2 sm:flex-1 dark:bg-transparent dark:text-white dark:ring-white/20 dark:hover:bg-gray-950/50 pointer-coarse:p-4">
          <input type="radio" name="memory-option" value="128 GB" className="sr-only" />
          <span>128 GB</span>
        </label>
```

----------------------------------------

TITLE: Apply Conditional Styles with forced-colors Variant in HTML
DESCRIPTION: This HTML snippet, using Tailwind CSS classes, demonstrates how to apply conditional styles based on the `forced-colors` media query. It showcases a theme selection form where elements like borders, backgrounds, text, and radio button appearances adapt when a user has enabled a forced color mode, ensuring accessibility.
SOURCE: https://github.com/tailwindlabs/tailwindcss.com/blob/main/src/docs/hover-focus-and-other-states.mdx#_snippet_43

LANGUAGE: HTML
CODE:
```
<div className="mx-auto max-w-sm border-x border-x-gray-200 px-6 pt-6 pb-4 text-gray-900 dark:border-x-gray-800 dark:bg-gray-950/10 dark:text-white">
  <form>
    <legend> Choose a theme: </legend>
    <div className="mt-4 grid grid-flow-col">
      <label htmlFor="theme-1" className="text-sm font-medium text-gray-700 dark:text-white">
        <div className="relative grid h-16 w-16 items-center justify-center rounded-xl border border-transparent bg-transparent text-white hover:bg-gray-50 has-checked:border-cyan-500 has-checked:bg-cyan-50 has-checked:text-cyan-50 dark:text-gray-800 dark:hover:bg-gray-800 dark:has-checked:bg-cyan-950 dark:has-checked:text-cyan-950 forced-colors:border-0">
          <input
            type="radio"
            name="themes"
            id="theme-1"
            className="appearance-none forced-colors:appearance-auto"
            defaultChecked
          />
          <p className="hidden forced-colors:block">Cyan</p>
          <div className="absolute top-3 left-3 h-6 w-6 rounded-full bg-cyan-200 forced-colors:hidden"></div>
          <div className="absolute right-3 bottom-3 h-6 w-6 rounded-full bg-cyan-500 ring-2 ring-current forced-colors:hidden"></div>
        </div>
      </label>
      <label htmlFor="theme-2" className="text-sm font-medium text-gray-700 dark:text-white">
        <div className="relative grid h-16 w-16 items-center justify-center rounded-xl border border-transparent bg-transparent text-white hover:bg-gray-50 has-checked:border-blue-500 has-checked:bg-blue-50 has-checked:text-blue-50 dark:text-gray-800 dark:hover:bg-gray-800 dark:has-checked:bg-blue-950 dark:has-checked:text-blue-950 forced-colors:border-0">
          <input
            type="radio"
            name="themes"
            id="theme-2"
            className="appearance-none forced-colors:appearance-auto"
          />
          <p className="hidden forced-colors:block">Blue</p>
          <div className="absolute top-3 left-3 h-6 w-6 rounded-full bg-blue-200 forced-colors:hidden"></div>
          <div className="absolute right-3 bottom-3 h-6 w-6 rounded-full bg-blue-500 ring-2 ring-current forced-colors:hidden"></div>
        </div>
      </label>
      <label htmlFor="theme-3" className="text-sm font-medium text-gray-700 dark:text-white">
        <div className="relative grid h-16 w-16 items-center justify-center rounded-xl border border-transparent bg-transparent text-white hover:bg-gray-50 has-checked:border-indigo-500 has-checked:bg-indigo-50 has-checked:text-indigo-50 dark:text-gray-800 dark:hover:bg-gray-800 dark:has-checked:bg-indigo-950 dark:has-checked:text-indigo-950 forced-colors:border-0">
          <input
            type="radio"
            name="themes"
            id="theme-3"
            className="appearance-none forced-colors:appearance-auto"
          />
          <p className="hidden forced-colors:block">Indigo</p>
          <div className="absolute top-3 left-3 h-6 w-6 rounded-full bg-indigo-200 forced-colors:hidden"></div>
          <div className="absolute right-3 bottom-3 h-6 w-6 rounded-full bg-indigo-500 ring-2 ring-current forced-colors:hidden"></div>
        </div>
      </label>
      <label htmlFor="theme-4" className="text-sm font-medium text-gray-700 dark:text-white">
        <div className="relative grid h-16 w-16 items-center justify-center rounded-xl border border-transparent bg-transparent text-white hover:bg-gray-50 has-checked:border-purple-500 has-checked:bg-purple-50 has-checked:text-purple-50 dark:text-gray-800 dark:hover:bg-gray-800 dark:has-checked:bg-purple-950 dark:has-checked:text-purple-950 forced-colors:border-0">
          <input
            type="radio"
            name="themes"
            id="theme-4"
            className="appearance-none forced-colors:appearance-auto"
          />
          <p className="hidden forced-colors:block">Purple</p>
          <div className="absolute top-3 left-3 h-6 w-6 rounded-full bg-purple-200 forced-colors:hidden"></div>
          <div className="absolute right-3 bottom-3 h-6 w-6 rounded-full bg-purple-500 ring-2 ring-current forced-colors:hidden"></div>
        </div>
      </label>
    </div>
  </form>
</div>
```
