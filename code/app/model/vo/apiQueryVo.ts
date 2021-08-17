export interface IGetRequestQueryVo {
	whereField?: string
	whereValue?: string
	perPage?: number
	page?: number
	orderBy?: string
	[propName: string]: any
}
