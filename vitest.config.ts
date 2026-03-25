import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

// defineConfig: Vitest의 설정을 정의하기 위한 도우미 함수입니다.
export default defineConfig({
	// plugins: Vite 플러그인을 설정합니다. @vitejs/plugin-react는 React 컴포넌트 테스트를 위해 필요합니다.
	plugins: [react()],
	test: {
		// environment: 테스트가 실행될 환경을 지정합니다. 'jsdom'은 브라우저 환경을 에뮬레이션합니다.
		environment: "jsdom",
		// globals: true로 설정하면 describe, it, expect 등을 import 없이 전역에서 사용할 수 있습니다.
		globals: true,
		// setupFiles: 각 테스트 파일이 실행되기 전에 실행할 설정 파일의 경로입니다.
		setupFiles: ["./tests/setup.ts"],
		// coverage: 테스트 커버리지 측정을 위한 설정입니다.
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
		},
	},
	resolve: {
		// alias: 경로 별칭을 설정하여 '@/'를 'src/' 폴더로 연결합니다.
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
