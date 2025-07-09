TITLE: Fetch Data from Expo API Route in Client (TypeScript/React Native)
DESCRIPTION: This React Native component demonstrates how to make a client-side `fetch` request to an Expo API route. It asynchronously fetches data from `/hello`, parses the JSON response, and displays an alert with the received data.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/reference/api-routes.mdx#_snippet_4

LANGUAGE: tsx
CODE:
```
import { Button } from 'react-native';

async function fetchHello() {
  const response = await fetch('/hello');
  const data = await response.json();
  alert('Hello ' + data.hello);
}

export default function App() {
  return <Button onPress={() => fetchHello()} title="Fetch hello" />;
}
```

----------------------------------------

TITLE: Run EAS Build for Automatic Server Deployment
DESCRIPTION: Execute the EAS build command to initiate the build process, which will now include the experimental automatic server deployment functionality if configured.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/reference/api-routes.mdx#_snippet_13

LANGUAGE: sh
CODE:
```
eas build
```

----------------------------------------

TITLE: Create Express Server Entry Point (`server.ts`)
DESCRIPTION: Defines the `server.ts` file, which sets up an Express server. This server serves static client assets from `dist/client` and delegates dynamic requests to Expo server routes from `dist/server` using `@expo/server/adapter/express`. It also includes middleware for compression and request logging.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/reference/api-routes.mdx#_snippet_22

LANGUAGE: TypeScript
CODE:
```
#!/usr/bin/env node

const path = require('path');
const { createRequestHandler } = require('@expo/server/adapter/express');

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');

const CLIENT_BUILD_DIR = path.join(process.cwd(), 'dist/client');
const SERVER_BUILD_DIR = path.join(process.cwd(), 'dist/server');

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable('x-powered-by');

process.env.NODE_ENV = 'production';

app.use(
  express.static(CLIENT_BUILD_DIR, {
    maxAge: '1h',
    extensions: ['html'],
  })
);

app.use(morgan('tiny'));

app.all(
  '*',
  createRequestHandler({
    build: SERVER_BUILD_DIR,
  })
);
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
```

----------------------------------------

TITLE: Handle GET Request with Custom Error Response in Expo API Route
DESCRIPTION: Illustrates how to handle errors in an Expo API route by returning a custom `Response` object with a specific status code and headers. This example shows how to return a 404 Not Found error if a required parameter is missing, providing more control over error messages than automatic error handling.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/reference/api-routes.mdx#_snippet_10

LANGUAGE: ts
CODE:
```
import { Request, Response } from 'expo-router/server';

export async function GET(request: Request, { post }: Record<string, string>) {
  if (!post) {
    return new Response('No post found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  // fetch data for `post`
  return Response.json({ ... });
}
```

----------------------------------------

TITLE: Setting initialRouteName for Deep Link Back Navigation
DESCRIPTION: Explains how to configure `unstable_settings.initialRouteName` in a layout file (`_layout.tsx`) to ensure a specific route is loaded first when a deep link opens the app. This helps maintain a consistent back stack, allowing users to navigate back to the intended starting point.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/basics/navigation.mdx#_snippet_14

LANGUAGE: tsx
CODE:
```
export const unstable_settings = {
  // Ensure any route can link back to `/
  initialRouteName: 'index'
};
```

----------------------------------------

TITLE: iOS WebView Native View and Module Definition
DESCRIPTION: This section provides the Swift code for the `ExpoWebView` native view, demonstrating how to implement `WKNavigationDelegate`'s `webView(_:didFinish:)` to dispatch the `onLoad` event, and the `ExpoWebViewModule` definition for registering the view and handling the `url` prop.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/modules/native-view-tutorial.mdx#_snippet_14

LANGUAGE: Swift
CODE:
```
import ExpoModulesCore
import WebKit

class ExpoWebView: ExpoView, WKNavigationDelegate {
  let webView = WKWebView()
  let onLoad = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    webView.navigationDelegate = self
    addSubview(webView)
  }

  override func layoutSubviews() {
    webView.frame = bounds
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    if let url = webView.url {
      onLoad([
        "url": url.absoluteString
      ])
    }
  }
}
```

LANGUAGE: Swift
CODE:
```
import ExpoModulesCore

public class ExpoWebViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoWebView")

    View(ExpoWebView.self) {
      Events("onLoad")

      Prop("url") { (view, url: URL) in
        if view.webView.url != url {
          let urlRequest = URLRequest(url: url)
          view.webView.load(urlRequest)
        }
      }
    }
  }
}
```

----------------------------------------

TITLE: Continuous Deployment Workflow with Fingerprint and Repack (YAML)
DESCRIPTION: An EAS Build workflow demonstrating continuous deployment. This workflow first generates a fingerprint, then conditionally builds or repacks the app based on whether a compatible build for that fingerprint already exists, and finally runs Maestro tests for both Android and iOS.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas/workflows/pre-packaged-jobs.mdx#_snippet_55

LANGUAGE: yaml
CODE:
```
name: continuous-deploy-fingerprint

jobs:
  fingerprint:
    id: fingerprint
    type: fingerprint

  android_get_build:
    needs: [fingerprint]
    id: android_get_build
    type: get-build
    params:
      fingerprint_hash: ${{ needs.fingerprint.outputs.android_fingerprint_hash }}
      platform: android

  android_repack:
    needs: [android_get_build]
    id: android_repack
    if: ${{ needs.android_get_build.outputs.build_id }}
    type: repack
    params:
      build_id: ${{ needs.android_get_build.outputs.build_id }}

  android_build:
    needs: [android_get_build]
    id: android_build
    if: ${{ !needs.android_get_build.outputs.build_id }}
    type: build
    params:
      platform: android
      profile: preview-simulator

  android_maestro:
    after: [android_repack, android_build]
    id: android_maestro
    type: maestro
    image: latest
    params:
      build_id: ${{ needs.android_repack.outputs.build_id || needs.android_build.outputs.build_id }}
      flow_path: ['maestro.yaml']

  ios_get_build:
    needs: [fingerprint]
    id: ios_get_build
    type: get-build
    params:
      fingerprint_hash: ${{ needs.fingerprint.outputs.ios_fingerprint_hash }}
      platform: ios

  ios_repack:
    needs: [ios_get_build]
    id: ios_repack
    if: ${{ needs.ios_get_build.outputs.build_id }}
    type: repack
    params:
      build_id: ${{ needs.ios_get_build.outputs.build_id }}

  ios_build:
    needs: [ios_get_build]
    id: ios_build
    if: ${{ !needs.ios_get_build.outputs.build_id }}
    type: build
    params:
      platform: ios
      profile: preview-simulator

  ios_maestro:
    after: [ios_repack, ios_build]
    id: ios_maestro
    type: maestro
    image: latest
    params:
      build_id: ${{ needs.ios_repack.outputs.build_id || needs.ios_build.outputs.build_id }}
      flow_path: ['maestro.yaml']
```

----------------------------------------

TITLE: Initial .easignore Configuration for EAS Build
DESCRIPTION: This snippet shows the initial content for a `.easignore` file. It's recommended to include all rules from your `.gitignore` file, along with additional directories and files unnecessary for the EAS Build process, such as documentation, native directories (if not prebuilt by EAS), and test coverage reports.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/build-reference/easignore.mdx#_snippet_0

LANGUAGE: .easignore
CODE:
```
# Copy everything from your .gitignore file here

# Ignore files and directories that EAS Build doesn't need to build your app
/docs

# Ignore native directories (if you are using EAS Build)
/android
/ios

# Ignore test coverage reports
/coverage
```

----------------------------------------

TITLE: Android Manifest Code Signing Configuration
DESCRIPTION: XML snippet for `AndroidManifest.xml` demonstrating how to add `meta-data` tags for `CODE_SIGNING_CERTIFICATE` (with an XML-escaped value) and `CODE_SIGNING_METADATA` when not using Continuous Native Generation (CNG).
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas-update/code-signing.mdx#_snippet_4

LANGUAGE: xml
CODE:
```
<meta-data
  android:name="expo.modules.updates.CODE_SIGNING_CERTIFICATE"
  android:value="(insert XML-escaped certificate here)"
  />
<meta-data
  android:name="expo.modules.updates.CODE_SIGNING_METADATA"
  android:value="{&quot;keyid&quot;:&quot;main&quot;,&quot;alg&quot;:&quot;rsa-v1_5-sha256&quot;}"
  />
```

----------------------------------------

TITLE: Start Expo Project with Tailwind CSS v3
DESCRIPTION: Command to start the Expo development server after configuring Tailwind CSS v3. This allows you to begin using Tailwind classes in your components and see the styles applied.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/guides/tailwind.mdx#_snippet_5

LANGUAGE: bash
CODE:
```
$ npx expo start
```

----------------------------------------

TITLE: Basic Syntax for EAS Workflow Require Approval Job
DESCRIPTION: Illustrates the minimal YAML syntax for defining a `require-approval` job within an Expo EAS workflow.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas/workflows/pre-packaged-jobs.mdx#_snippet_46

LANGUAGE: yaml
CODE:
```
jobs:
  require_approval:
    type: require-approval
```

----------------------------------------

TITLE: Configure Environment Variables in eas.json
DESCRIPTION: This JSON snippet demonstrates how to define environment variables within different build profiles (e.g., 'production' and 'preview') in your eas.json file. The 'env' field allows you to specify key-value pairs that will be available as environment variables during the build process, enabling different API endpoints for various environments.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/build/eas-json.mdx#_snippet_11

LANGUAGE: json
CODE:
```
{
  "build": {
    "production": {
      "node": "16.13.0",
      "env": {
        "API_URL": "https://company.com/api"
      }
    },
    "preview": {
      "extends": "production",
      "distribution": "internal",
      "env": {
        "API_URL": "https://staging.company.com/api"
      }
    }
  }
}
```

----------------------------------------

TITLE: Run an EAS Workflow from CLI
DESCRIPTION: Executes a specific EAS Workflow defined in a YAML file, such as `create-production-builds.yml`, using the EAS CLI. This command initiates the defined CI/CD process.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas/workflows/get-started.mdx#_snippet_4

LANGUAGE: shell
CODE:
```
npx eas-cli@latest workflow:run create-production-builds.yml
```

----------------------------------------

TITLE: Configure app.config.ts for Comprehensive TypeScript Setup
DESCRIPTION: This TypeScript snippet shows how to enable a more comprehensive TypeScript setup for app.config.ts by adding 'ts-node/register'. This allows app.config.ts to support external TypeScript modules and tsconfig.json customizations.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/guides/typescript.mdx#_snippet_15

LANGUAGE: ts
CODE:
```
import 'ts-node/register'; // Add this to import TypeScript files
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'my-app',
  slug: 'my-app',
};

export default config;
```

----------------------------------------

TITLE: Example app.json for Initial Expo Configuration
DESCRIPTION: This JSON snippet provides a basic `app.json` structure. Expo CLI reads this file first and passes its normalized results to `app.config.js` when an exported function is used for configuration.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/workflow/configuration.mdx#_snippet_3

LANGUAGE: json
CODE:
```
{
  "name": "My App"
}
```

----------------------------------------

TITLE: GitHub Actions Workflow for EAS Build
DESCRIPTION: YAML configuration for a GitHub Actions workflow (`.github/workflows/eas-build.yml`) to automate EAS builds. It sets up Node.js, uses the `expo/expo-github-action` for EAS CLI setup, installs dependencies, and then executes the `eas build` command. The workflow can be triggered manually or on pushes to the `main` branch.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/build/building-on-ci.mdx#_snippet_6

LANGUAGE: yaml
CODE:
```
name: EAS Build
on:
  workflow_dispatch:
  push:
    branches:
      - main
jobs:
  build:
    name: Install and build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: npm
      - name: Setup Expo and EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Install dependencies
        run: npm ci
      - name: Build on EAS
        run: eas build --platform all --non-interactive --no-wait
```

----------------------------------------

TITLE: Android Native Module for Theme Management (Initial)
DESCRIPTION: Implements an Expo native module for Android using Kotlin. It provides functions to set and get a theme string, and emits an event when the theme changes. It uses Android's `SharedPreferences` for persistence and `Bundle` for event payloads.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/modules/native-module-tutorial.mdx#_snippet_10

LANGUAGE: kotlin
CODE:
```
package expo.modules.settings

import android.content.Context
import android.content.SharedPreferences
import androidx.core.os.bundleOf
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoSettingsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoSettings")

    Events("onChangeTheme")

    Function("setTheme") { theme: String ->
      getPreferences().edit().putString("theme", theme).commit()
      this@ExpoSettingsModule.sendEvent("onChangeTheme", bundleOf("theme" to theme))
    }

    Function("getTheme") {
      return@Function getPreferences().getString("theme", "system")
    }
  }

  private val context
  get() = requireNotNull(appContext.reactContext)

  private fun getPreferences(): SharedPreferences {
    return context.getSharedPreferences(context.packageName + ".settings", Context.MODE_PRIVATE)
  }
}
```

----------------------------------------

TITLE: Configure package.json Main Entry for Expo Router
DESCRIPTION: Sets the `main` property in `package.json` to `expo-router/entry`, directing Expo to use the Expo Router's default entry point for application bootstrapping.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/installation.mdx#_snippet_3

LANGUAGE: json
CODE:
```
{
  "main": "expo-router/entry"
}
```

----------------------------------------

TITLE: Create New Expo Project with TypeScript Template
DESCRIPTION: Use `create-expo-app` to initialize a new Expo project with a default TypeScript configuration, example code, and basic navigation structure. This command sets up a ready-to-use TypeScript environment.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/guides/typescript.mdx#_snippet_0

LANGUAGE: Shell
CODE:
```
$ npx create-expo-app@latest
```

----------------------------------------

TITLE: Basic Crypto Usage with expo-crypto
DESCRIPTION: Demonstrates how to use `expo-crypto` to perform a SHA256 digest on a string within a React Native `useEffect` hook. It shows importing the library, calling `digestStringAsync`, and logging the resulting digest.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/versions/v52.0.0/sdk/crypto.mdx#_snippet_0

LANGUAGE: jsx
CODE:
```
import { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import * as Crypto from 'expo-crypto';

export default function App() {
  useEffect(() => {
    (async () => {
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        'GitHub stars are neat 🌟'
      );
      console.log('Digest: ', digest);
      /* Some crypto operation... */
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Crypto Module Example</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

----------------------------------------

TITLE: Check if Current Screen Can Be Dismissed in Expo Router
DESCRIPTION: This example illustrates the use of `router.canDismiss()` to programmatically check if the current screen can be dismissed. This method returns `true` if the router is within a stack that has more than one screen in its history, allowing for conditional navigation logic. The snippet shows how to integrate this check before attempting a dismissal action.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/advanced/stack.mdx#_snippet_11

LANGUAGE: tsx
CODE:
```
import { Button, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function Settings() {
  const router = useRouter();

  const handleDismiss = (count: number) => {
    if (router.canDismiss()) {
      router.dismiss(count)
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="Maybe dismiss" onPress={() => handleDismiss()} />
    </View>
  );
}
```

----------------------------------------

TITLE: Start Expo Development Server with Tunnel Connection
DESCRIPTION: Use this command to start the Expo development server with a tunnel connection, which can resolve connectivity issues on public or restricted networks by making your local machine accessible from other devices. Note that tunnel connections can be slower.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/get-started/start-developing.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
$ npx expo start --tunnel
```

----------------------------------------

TITLE: Access Environment Variables in Server-Only Components
DESCRIPTION: Shows how to use `process.env` to access environment variables (secrets) in a server-only component. It uses `import 'server-only'` to ensure the module never runs on the client, fetching data with an Authorization header using a defined secret.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/guides/server-components.mdx#_snippet_14

LANGUAGE: tsx
CODE:
```
// This will assert if the module runs on the client.
import 'server-only';

import { Text } from 'react-native';

export async function renderData() {
  // This code only runs on the server.
  const data = await fetch('https://my-endpoint/', {
    headers: {
      Authorization: `Bearer ${process.env.SECRET}`,
    },
  });

  // ...
  return <div />;
}
```

----------------------------------------

TITLE: Link to Nested Stack Route with `withAnchor` in Expo Router
DESCRIPTION: This example demonstrates how to create a link that navigates to a specific route within a nested stack navigator from a tab's index page. The `withAnchor` prop, used in conjunction with `initialRouteName` in the stack's layout, ensures that the base route of the stack is pushed first, maintaining a consistent navigation history.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/basics/common-navigation-patterns.mdx#_snippet_2

LANGUAGE: tsx
CODE:
```
<Link href="/feed/123" withAnchor>
  Go to post
</Link>
```

----------------------------------------

TITLE: Start Expo Project Development Server
DESCRIPTION: This command starts the Expo development server, allowing you to run your application on a mobile device via Expo Go, a web browser, or emulators/simulators.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/installation.mdx#_snippet_1

LANGUAGE: shell
CODE:
```
npx expo start
```

----------------------------------------

TITLE: Statically Type Single URL Parameter with useLocalSearchParams (TSX)
DESCRIPTION: This example demonstrates how to use generics with `useLocalSearchParams` to statically type a single route parameter, such as 'user'. The code shows how to extract and display the typed parameter from the URL, ensuring type safety.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/reference/url-parameters.mdx#_snippet_6

LANGUAGE: tsx
CODE:
```
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function Route() {
  const { user } = useLocalSearchParams<{ user: string }>();

  return <Text>User: {user}</Text>;
}

// Given the URL: `/evanbacon`
// The following is returned: { user: "evanbacon" }
```

----------------------------------------

TITLE: Android WebView Native View and Module Definition
DESCRIPTION: This section provides the Kotlin code for the `ExpoWebView` native view, demonstrating how to override `onPageFinished` to dispatch the `onLoad` event, and the `ExpoWebViewModule` definition for registering the view and handling the `url` prop.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/modules/native-view-tutorial.mdx#_snippet_13

LANGUAGE: Kotlin
CODE:
```
package expo.modules.webview

import android.content.Context
import android.webkit.WebView
import android.webkit.WebViewClient
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class ExpoWebView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onLoad by EventDispatcher()

  internal val webView = WebView(context).also {
    it.layoutParams = LayoutParams(
      LayoutParams.MATCH_PARENT,
      LayoutParams.MATCH_PARENT
    )

    it.webViewClient = object : WebViewClient() {
      override fun onPageFinished(view: WebView, url: String) {
        onLoad(mapOf("url" to url))
      }
    }

    addView(it)
  }
}
```

LANGUAGE: Kotlin
CODE:
```
package expo.modules.webview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class ExpoWebViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoWebView")

    View(ExpoWebView::class) {
      Events("onLoad")

      Prop("url") { view: ExpoWebView, url: URL? ->
        view.webView.loadUrl(url.toString())
      }
    }
  }
}
```

----------------------------------------

TITLE: Configure expo-location plugin in app.json
DESCRIPTION: Example `app.json` configuration for the `expo-location` config plugin, setting the `locationAlwaysAndWhenInUsePermission` message for iOS.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/versions/v53.0.0/sdk/location.mdx#_snippet_0

LANGUAGE: json
CODE:
```
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location."
        }
      ]
    ]
  }
}
```

----------------------------------------

TITLE: Basic Usage of eas/configure_ios_version in YAML
DESCRIPTION: This YAML snippet demonstrates the basic integration of the `eas/configure_ios_version` step into an EAS build workflow. It shows how to include the step without specifying any custom input parameters, relying on default version resolution.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/custom-builds/schema.mdx#_snippet_68

LANGUAGE: yaml
CODE:
```
build:
  name: Configure iOS version
  steps:
    - eas/checkout
    - eas/install_node_modules
    - eas/resolve_apple_team_id_from_credentials:
        id: resolve_apple_team_id_from_credentials
    - eas/prebuild:
        inputs:
          clean: false
          apple_team_id: ${ steps.resolve_apple_team_id_from_credentials.apple_team_id }
    - eas/configure_eas_update
    - eas/configure_ios_credentials
    - eas/configure_ios_version
```

----------------------------------------

TITLE: Configure Async Routes in Expo Router (Basic)
DESCRIPTION: Enables async bundling for Expo Router by setting the `asyncRoutes` option in `app.json`, specifying `web` and `default` platform settings.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/reference/async-routes.mdx#_snippet_0

LANGUAGE: json
CODE:
```
{
  "expo": {
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://acme.com",
          "asyncRoutes": {
            "web": true,
            "default": "development"
          }
        }
      ]
    ]
  }
}
```

----------------------------------------

TITLE: Build iOS App and Manually Regenerate Provisioning Profile with EAS CLI
DESCRIPTION: Initiates an iOS application build using Expo EAS. This command is particularly useful for regenerating expired provisioning profiles, ensuring the app can be successfully built and submitted to the App Store. It handles the association of the app with its required credentials during the build process.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/app-signing/app-credentials.mdx#_snippet_4

LANGUAGE: Shell
CODE:
```
eas build -p ios
```

----------------------------------------

TITLE: Login and Manage Credentials with EAS CLI
DESCRIPTION: This snippet demonstrates how to log into your Expo account and then use the EAS CLI to manage app signing credentials, such as certificates and provisioning profiles, which are essential for creating iOS builds with EAS Build.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/app-signing/apple-developer-program-roles-and-permissions.mdx#_snippet_0

LANGUAGE: Shell
CODE:
```
$ eas login

$ eas credentials
```

----------------------------------------

TITLE: EAS Checkout Function Usage Example
DESCRIPTION: Illustrates the minimal configuration required to use the `eas/checkout` built-in function. This function is essential for ensuring your project source files are available in the build environment.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas/workflows/syntax.mdx#_snippet_45

LANGUAGE: yaml
CODE:
```
jobs:
  my_job:
    steps:
      - uses: eas/checkout
```

----------------------------------------

TITLE: Building Production Android App with EAS Build (Shell)
DESCRIPTION: This command initiates a production build for an Android application using EAS Build, preparing the app for submission to the Google Play Store by applying the specified production profile.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/submit/android.mdx#_snippet_8

LANGUAGE: Shell
CODE:
```
eas build --platform android --profile production
```

----------------------------------------

TITLE: Configure EAS Build to Start iOS Simulator
DESCRIPTION: This YAML snippet illustrates how to integrate the `eas/start_ios_simulator` step into an `eas.json` or `build-and-test.yml` configuration. It ensures an iOS Simulator is ready for subsequent testing steps, such as Maestro tests, during an EAS build.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/custom-builds/schema.mdx#_snippet_86

LANGUAGE: yaml
CODE:
```
build:
  name: Build and test
  steps:
    - eas/build
    - eas/start_ios_simulator
```

----------------------------------------

TITLE: Publish EAS Update with Auto-filled Branch and Message
DESCRIPTION: The `--auto` flag simplifies the update process by automatically using the current Git branch name and the latest Git commit message for the update. This is useful for quick deployments from a Git-managed project.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas-update/eas-cli.mdx#_snippet_7

LANGUAGE: shell
CODE:
```
$ eas update --auto
```

----------------------------------------

TITLE: EAS Workflow: Control Flow with Require Approval for Interactive Story
DESCRIPTION: This example shows how `require-approval` can be used to create an interactive workflow, allowing a user's decision to determine the subsequent path (e.g., a 'happy ending' or 'epic battle' based on approval or rejection).
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas/workflows/pre-packaged-jobs.mdx#_snippet_48

LANGUAGE: yaml
CODE:
```
jobs:
  show_story_intro:
    name: Dragon and Knight Story Intro
    type: doc
    params:
      md: |
        # The Dragon and the Knight

        Once upon a time, in a land far away, a brave knight set out to face a mighty dragon.

        The dragon roared, breathing fire across the valley, but the knight stood firm, shield raised high.

        Now, the fate of their encounter is in your hands...

  require_approval:
    name: Should the knight and dragon become friends?
    needs: [show_story_intro]
    type: require-approval

  happy_ending:
    name: Friendship Ending
    needs: [require_approval]
    type: doc
    params:
      md: |
        ## A New Friendship

        The knight lowered his sword, and the dragon ceased its fire. They realized they both longed for peace. From that day on, they became the best of friends, protecting the kingdom together.

  epic_battle:
    name: Epic Battle Ending
    after: [require_approval]
    if: ${{ failure() }}
    type: doc
    params:
      md: |
        ## The Epic Battle

        The knight charged forward, and the dragon unleashed a mighty roar. Their battle shook the mountains and echoed through the ages. In the end, both were remembered as fierce and noble adversaries.
```

----------------------------------------

TITLE: Define a Reusable EAS Function to List Files
DESCRIPTION: This YAML snippet defines a reusable EAS function named `list_files` that executes the `ls -la` command to list files in the current working directory.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/custom-builds/schema.mdx#_snippet_93

LANGUAGE: yaml
CODE:
```
functions:
  list_files:
    name: List files
    command: ls -la
```

----------------------------------------

TITLE: YAML Example: Basic `eas/generate_gymfile_from_template` Usage
DESCRIPTION: An example `eas.yml` configuration demonstrating the basic usage of `eas/generate_gymfile_from_template` with credentials. It includes steps for checkout, node module installation, Apple Team ID resolution, prebuild, update configuration, iOS credentials setup, and the `generate_gymfile_from_template` step.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/custom-builds/schema.mdx#_snippet_75

LANGUAGE: YAML
CODE:
```
build:
  name: Generate Gymfile template
  steps:
    - eas/checkout
    - eas/install_node_modules
    - eas/resolve_apple_team_id_from_credentials:
        id: resolve_apple_team_id_from_credentials
    - eas/prebuild:
        inputs:
          clean: false
          apple_team_id: ${ steps.resolve_apple_team_id_from_credentials.apple_team_id }
    - eas/configure_eas_update
    - eas/configure_ios_credentials
    # @info #
    - eas/generate_gymfile_from_template:
        inputs:
          credentials: ${ eas.job.secrets.buildCredentials }
    # @end #
```

----------------------------------------

TITLE: EAS Checkout Project Source Files
DESCRIPTION: Demonstrates how to use the `eas/checkout` function to check out project source files within an EAS build configuration. This example then lists the contents of the `assets` directory after the checkout, verifying the files are available.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/custom-builds/schema.mdx#_snippet_51

LANGUAGE: YAML
CODE:
```
build:
  name: List files
  steps:
    - eas/checkout
    - run:
        name: List assets
        run: ls assets
```

----------------------------------------

TITLE: EAS Workflow Job Output Structure and Interpolation
DESCRIPTION: This snippet illustrates the structure of outputs available from EAS Workflow jobs, including `status` and a dynamic `outputs` object. It also demonstrates how to access and interpolate these outputs, specifically a `date` output from a `setup` job, into environment variables for a downstream `build_ios` job using the `needs` keyword.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas/workflows/syntax.mdx#_snippet_18

LANGUAGE: APIDOC
CODE:
```
{
  "status": "success" | "failure" | "skipped",
  /* @info Every job produces a different set of outputs. See the specific job's documentation for details. */
  "outputs": {}
  /* @end */
}
```

LANGUAGE: yaml
CODE:
```
jobs:
  setup:
    outputs:
      date: ${{ steps.current_date.outputs.date }}
    steps:
      - id: current_date
        run: |
          DATE=$(date +"%Y.%-m.%-d")
          set-output date "$DATE"

  build_ios:
    needs: [setup]
    type: build
    env:
      # You might use process.env.VERSION_SUFFIX to customize
      # app version in your dynamic app config.
      VERSION_SUFFIX: ${{ needs.setup.outputs.date }}
    params:
      platform: ios
      profile: development
```

----------------------------------------

TITLE: EAS Build Profiles for Managed Expo Project
DESCRIPTION: This example demonstrates an `eas.json` configuration for a managed Expo project. It showcases how to define multiple build profiles (base, development, staging, production) with inherited settings, custom Node.js/Yarn versions, environment variables, and platform-specific overrides for Android and iOS.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/build/eas-json.mdx#_snippet_9

LANGUAGE: json
CODE:
```
{
  "build": {
    "base": {
      "node": "12.13.0",
      "yarn": "1.22.5",
      "env": {
        "EXAMPLE_ENV": "example value"
      },
      "android": {
        "image": "default",
        "env": {
          "PLATFORM": "android"
        }
      },
      "ios": {
        "image": "latest",
        "env": {
          "PLATFORM": "ios"
        }
      }
    },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "env": {
        "ENVIRONMENT": "development"
      },
      "android": {
        "distribution": "internal",
        "withoutCredentials": true
      },
      "ios": {
        "simulator": true
      }
    },
    "staging": {
      "extends": "base",
      "env": {
        "ENVIRONMENT": "staging"
      },
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "extends": "base",
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

----------------------------------------

TITLE: Configure Minimal EAS Production Build Profile
DESCRIPTION: This JSON snippet shows a minimal configuration for an EAS production build profile. An empty object for `production` implies default settings, which are suitable for submission to app stores like Google Play Store or Apple App Store.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/build/eas-json.mdx#_snippet_4

LANGUAGE: json
CODE:
```
{
  "build": {
    "production": {}
  }
}
```

----------------------------------------

TITLE: Add NSUserTrackingUsageDescription to iOS Info.plist
DESCRIPTION: For manual iOS projects, it is essential to add the `NSUserTrackingUsageDescription` key with a descriptive string to your `Info.plist` file. This string is displayed to users when your app requests tracking permission, explaining why their data is being tracked.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/versions/v53.0.0/sdk/tracking-transparency.mdx#_snippet_2

LANGUAGE: xml
CODE:
```
<key>NSUserTrackingUsageDescription</key>
<string>Your custom usage description string here.</string>
```

----------------------------------------

TITLE: Configure Expo Project with TypeScript in app.config.ts
DESCRIPTION: This TypeScript example demonstrates how to create an `app.config.ts` file for Expo configuration, leveraging TypeScript features like type checking, autocomplete, and doc-blocks. It imports `ExpoConfig` and `ConfigContext` for type safety.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/workflow/configuration.mdx#_snippet_7

LANGUAGE: ts
CODE:
```
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  slug: 'my-app',
  name: 'My App',
});
```

----------------------------------------

TITLE: Automated Expo Production Deployment Workflow (YAML)
DESCRIPTION: This YAML configuration defines a comprehensive CI/CD workflow for Expo applications, triggered on pushes to the 'main' branch. It uses Expo Fingerprint to check for native changes, then conditionally performs a new build and submission to app stores (Android/iOS) or publishes an over-the-air update to existing builds.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas/workflows/examples.mdx#_snippet_6

LANGUAGE: yaml
CODE:
```
name: Deploy to production

on:
  push:
    branches: ['main']

jobs:
  fingerprint:
    name: Fingerprint
    type: fingerprint
  get_android_build:
    name: Check for existing android build
    needs: [fingerprint]
    type: get-build
    params:
      fingerprint_hash: ${{ needs.fingerprint.outputs.android_fingerprint_hash }}
      profile: production
  get_ios_build:
    name: Check for existing ios build
    needs: [fingerprint]
    type: get-build
    params:
      fingerprint_hash: ${{ needs.fingerprint.outputs.ios_fingerprint_hash }}
      profile: production
  build_android:
    name: Build Android
    needs: [get_android_build]
    if: ${{ !needs.get_android_build.outputs.build_id }}
    type: build
    params:
      platform: android
      profile: production
  build_ios:
    name: Build iOS
    needs: [get_ios_build]
    if: ${{ !needs.get_ios_build.outputs.build_id }}
    type: build
    params:
      platform: ios
      profile: production
  submit_android_build:
    name: Submit Android Build
    needs: [build_android]
    type: submit
    params:
      build_id: ${{ needs.build_android.outputs.build_id }}
  submit_ios_build:
    name: Submit iOS Build
    needs: [build_ios]
    type: submit
    params:
      build_id: ${{ needs.build_ios.outputs.build_id }}
  publish_android_update:
    name: Publish Android update
    needs: [get_android_build]
    if: ${{ needs.get_android_build.outputs.build_id }}
    type: update
    params:
      branch: production
      platform: android
  publish_ios_update:
    name: Publish iOS update
    needs: [get_ios_build]
    if: ${{ needs.get_ios_build.outputs.build_id }}
    type: update
    params:
      branch: production
      platform: ios
```

----------------------------------------

TITLE: Expo Router Stack Navigator with Custom Screen Options
DESCRIPTION: This snippet demonstrates how to apply specific screen options to individual routes within an Expo Router `Stack` navigator. By including `Stack.Screen` components inside the `Stack`, you can configure properties like `headerShown` for specific routes (e.g., `[productId]`) without needing to explicitly define the component, as Expo Router handles the mapping automatically based on the `name` prop.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/basics/layout.mdx#_snippet_2

LANGUAGE: tsx
CODE:
```
import { Stack } from 'expo-router';

export default function StackLayout() {
  return (
    <Stack>
      <Stack.Screen name="[productId]" options={{ headerShown: false }} />
    </Stack>
  );
}
```

----------------------------------------

TITLE: Run EAS Workflow to Create Development Builds
DESCRIPTION: This command executes the `create-development-builds.yml` workflow file using the `eas workflow:run` command. It initiates the parallel build jobs for Android and iOS development clients as configured in the YAML file.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas/workflows/examples.mdx#_snippet_2

LANGUAGE: Shell
CODE:
```
$ eas workflow:run .eas/workflows/create-development-builds.yml
```

----------------------------------------

TITLE: Implement Theme Settings in Android Native Module (Kotlin)
DESCRIPTION: This snippet shows how to create an Expo native module in Kotlin to manage a "theme" string in Android's SharedPreferences. It defines `setTheme` to save the value and `getTheme` to retrieve it, defaulting to 'system' if not found.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/modules/native-module-tutorial.mdx#_snippet_5

LANGUAGE: kotlin
CODE:
```
package expo.modules.settings

import android.content.Context
import android.content.SharedPreferences
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoSettingsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoSettings")

    Function("setTheme") { theme: String ->
      getPreferences().edit().putString("theme", theme).commit()
    }

    Function("getTheme") {
      return@Function getPreferences().getString("theme", "system")
    }
  }

  private val context
  get() = requireNotNull(appContext.reactContext)

  private fun getPreferences(): SharedPreferences {
    return context.getSharedPreferences(context.packageName + ".settings", Context.MODE_PRIVATE)
  }
}
```

----------------------------------------

TITLE: EAS Android Build Steps with Credentials
DESCRIPTION: Outlines the comprehensive sequence of EAS CLI commands and internal steps for an Android build that requires credentials, used for `internal` and `store` distribution. This process includes steps for injecting Android-specific credentials and configuring the app version.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/custom-builds/schema.mdx#_snippet_39

LANGUAGE: APIDOC
CODE:
```
eas/checkout
eas/use_npm_token
eas/install_node_modules
eas/resolve_build_config
eas/prebuild
eas/configure_eas_update
eas/inject_android_credentials
eas/configure_android_version
eas/run_gradle
eas/find_and_upload_build_artifacts
```

----------------------------------------

TITLE: Add Expo Crypto Package to npm Dependencies
DESCRIPTION: This command adds the `expo-crypto` package to your project's npm dependencies. It uses `npx expo install`, which is the recommended method for installing Expo-related packages, ensuring proper linking and compatibility.
SOURCE: https://github.com/expo/expo/blob/main/packages/expo-crypto/README.md#_snippet_0

LANGUAGE: bash
CODE:
```
npx expo install expo-crypto
```

----------------------------------------

TITLE: Configure Expo Router for Server Output (JSON)
DESCRIPTION: This JSON configuration snippet for `app.json` enables server output for an Expo project. Setting `web.output` to `server` ensures that a server bundle is generated alongside the client bundle, which is necessary for API routes to function.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/reference/api-routes.mdx#_snippet_1

LANGUAGE: json
CODE:
```
{
  "web": {
    "output": "server"
  }
}
```

----------------------------------------

TITLE: Console Output on Initial App Load with URL Parameters
DESCRIPTION: This terminal output shows the console log when the Expo Router application first starts. It demonstrates the initial values of both local and global URL parameters, which are identical at this point.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/reference/url-parameters.mdx#_snippet_3

LANGUAGE: terminal
CODE:
```
Local: evanbacon Global: evanbacon
```

----------------------------------------

TITLE: Navigate to Expo Router Modal Screen
DESCRIPTION: This example shows how to use the `Link` component from `expo-router` to navigate to a modal screen. The `href` prop specifies the route name of the modal, allowing users to open the modal from a different screen, such as the home screen.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/advanced/modals.mdx#_snippet_1

LANGUAGE: tsx
CODE:
```
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text>Home screen</Text>
      /* @info Use the <CODE>Link</CODE> component to navigate to the modal screen. The <CODE>href</CODE> prop is the route name of the modal screen. */
      <Link href="/modal" style={styles.link}>
        Open modal
      </Link>
      /* @end */
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    paddingTop: 20,
    fontSize: 20,
  },
});
```

----------------------------------------

TITLE: Basic Navigation with Expo Router Link Component
DESCRIPTION: Illustrates the fundamental usage of the `Link` component from `expo-router` for declarative navigation. Similar to web links, it allows users to navigate to a specified `href` (URL) when tapped. By default, `Link` components can only wrap `Text` elements.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/basics/navigation.mdx#_snippet_1

LANGUAGE: tsx
CODE:
```
import { View } from 'react-native';
import { Link } from 'expo-router';

export default function Page() {
  return (
    <View>
      <Link href="/about">About</Link>
    </View>
  );
}
```

----------------------------------------

TITLE: Initiating Gradual Rollout with EAS Update (Shell)
DESCRIPTION: This command initiates a gradual rollout of an update to a specified percentage of users (e.g., 10%) on the current channel using EAS Update. This allows for controlled deployment and monitoring of new versions.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/eas-update/deployment.mdx#_snippet_4

LANGUAGE: Shell
CODE:
```
eas update --rollout-percentage 10
```

----------------------------------------

TITLE: Handling Navigation Events with useEffect
DESCRIPTION: Illustrates how to subscribe to navigation events, such as 'tabPress', using `navigation.addListener` within a `useEffect` hook. This ensures that event listeners are correctly added and cleaned up when the screen is navigated to, rather than when it's preloaded.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/basics/navigation.mdx#_snippet_11

LANGUAGE: tsx
CODE:
```
const navigation = useNavigation();

useEffect(() => {
  const unsubscribe = navigation.addListener('tabPress', () => {
    // do something
  });

  return () => {
    unsubscribe();
  };
}, [navigation]);
```

----------------------------------------

TITLE: Creating Relative Paths with useSegments Hook
DESCRIPTION: Example of a React component using `useSegments()` from `expo-router` to construct dynamic, relative paths while preserving the current tab context, useful for complex navigation structures within nested layouts.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/router/reference/typed-routes.mdx#_snippet_4

LANGUAGE: tsx
CODE:
```
import { Link, useSegments } from 'expo-router';

export function Button() {
  const [
    // This will be either `(feed)` or `(search)` depending on the current tab.
    first,
  ] = useSegments();

  return <Link href={`/${first}/profile`}>Push profile</Link>;
}
```

----------------------------------------

TITLE: Implement Basic Navigation with Expo Router Link Component
DESCRIPTION: This snippet demonstrates how to use the `Link` component from `expo-router` to navigate between different screens in a React Native application. It shows importing `Link`, adding it to a component, and styling it to act as a clickable navigation element. The `href` prop specifies the target route.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/tutorial/add-navigation.mdx#_snippet_2

LANGUAGE: TypeScript
CODE:
```
import { Text, View, StyleSheet } from 'react-native';
/* @tutinfo Import <CODE>Link</CODE> component from <CODE>expo-router</CODE>. */ import { Link } from 'expo-router'; /* @end */

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home screen</Text>
      /* @tutinfo Add <CODE>Link</CODE> component after <CODE>Text</CODE> component and pass the <CODE>href</CODE> prop with <CODE>/about</CODE> route. */
      <Link href="/about" style={styles.button}>
        Go to About screen
      </Link>
      /* @end */
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
  /* @tutinfo Add the style of <CODE>fontSize</CODE>, <CODE>textDecorationLine</CODE>, and <CODE>color</CODE> to <CODE>Link</CODE> component. */
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
  /* @end */
});
```

----------------------------------------

TITLE: Register Custom Base Modifier in Expo app.config.js
DESCRIPTION: This JavaScript configuration demonstrates how to register the custom `withAppDelegateHeaderBaseMod` and `withSimpleAppDelegateHeaderMod` plugins within an Expo `app.config.js` file. It's crucial to note that base modifiers must be added last in the plugins array. This ensures that the modifications are written to disk correctly after all other plugins have processed the configuration.
SOURCE: https://github.com/expo/expo/blob/main/docs/pages/config-plugins/development-and-debugging.mdx#_snippet_20

LANGUAGE: JavaScript
CODE:
```
// Required for external files using TS
require('ts-node/register');

import {
  withAppDelegateHeaderBaseMod,
  withSimpleAppDelegateHeaderMod,
} from './withAppDelegateHeaderBaseMod.ts';

export default ({ config }) => {
  if (!config.plugins) config.plugins = [];
  config.plugins.push(
    withSimpleAppDelegateHeaderMod,

    // Base mods MUST be last
    withAppDelegateHeaderBaseMod
  );
  return config;
};
```
