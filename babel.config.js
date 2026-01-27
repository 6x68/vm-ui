export default {
	extends: `${import.meta.resolve("@gera2ld/plaid/config/babelrc-base").slice(7)}.js`,
	presets: ["@babel/preset-typescript"],
	plugins: [
		[
			"@babel/plugin-transform-react-jsx",
			{
				pragma: "VM.h",
				pragmaFrag: "VM.Fragment",
			},
		],
	].filter(Boolean),
};
