declare module "*.svg" {
	const content: string;
	export default content;
}

declare module "*.woff" {
	const content: ArrayBuffer;
	export default content;
}

declare module "*.txt" {
	const content: string;
	export default content;
}
