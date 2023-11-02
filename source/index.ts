import {
	access as _access,
	readFile as _readFile,
	writeFile as _writeFile,
	unlink as _unlink,
	readdir as _readdir,
	constants,
} from 'fs'
import Errlop from 'errlop'

/** Check access of a file */
export function access(path: string, mode: number): Promise<void> {
	return new Promise(function (resolve, reject) {
		_access(path, mode, function (err) {
			if (err) return reject(err)
			resolve()
		})
	})
}

/** Check the existence of a file */
export function exists(path: string): Promise<void> {
	return access(path, constants.F_OK)
}

/** Check the existence status of a file */
export function isPresent(path: string): Promise<boolean> {
	return exists(path)
		.then(() => true)
		.catch(() => false)
}

/** Check the readable status of a file */
export function readable(path: string): Promise<void> {
	return access(path, constants.R_OK)
}

/** Check the readable status of a file */
export function isReadable(path: string): Promise<boolean> {
	return readable(path)
		.then(() => true)
		.catch(() => false)
}

/** Check the writable status of a file */
export function writable(path: string): Promise<void> {
	return access(path, constants.W_OK)
}

/** Check the writable status of a file */
export function isWritable(path: string): Promise<boolean> {
	return writable(path)
		.then(() => true)
		.catch(() => false)
}

/** Check the executable status of a file */
export function executable(path: string): Promise<void> {
	return access(path, constants.X_OK)
}

/** Check the executable status of a file */
export function isExecutable(path: string): Promise<boolean> {
	return executable(path)
		.then(() => true)
		.catch(() => false)
}

/** Read a file */
export function read(path: string): Promise<string> {
	return new Promise(function (resolve, reject) {
		_readFile(path, { encoding: 'utf8' }, function (err, contents) {
			if (err) return reject(new Errlop(`failed to read file at: ${path}`, err))
			return resolve(contents)
		})
	})
}

/** Read a file safely */
export async function readFile(path: string): Promise<string> {
	// check exists
	try {
		await exists(path)
	} catch (err: any) {
		throw new Errlop(`unable to read the non-existent file: ${path}`, err)
	}

	// check readable
	try {
		await readable(path)
	} catch (err: any) {
		throw new Errlop(`no read permission for the existing file: ${path}`, err)
	}

	// attempt read
	try {
		return await read(path)
	} catch (err: any) {
		throw new Errlop(
			`failed to read the existing and readable file: ${path}`,
			err,
		)
	}
}

/** Write contents to a file */
export function write(
	path: string,
	contents: any,
	mode?: number,
): Promise<void> {
	return new Promise(function (resolve, reject) {
		_writeFile(path, contents, { encoding: 'utf8', mode }, function (err) {
			if (err)
				return reject(new Errlop(`failed to write file at: ${path}`, err))
			return resolve()
		})
	})
}

/** Write contents to a file safely */
export async function writeFile(
	path: string,
	contents: any,
	mode?: number,
): Promise<void> {
	// check exists
	try {
		await exists(path)
	} catch (err: any) {
		// attempt write to non-existent file
		try {
			await write(path, contents, mode)
		} catch (err: any) {
			throw new Errlop(`failed to write the non-existent file: ${path}`, err)
		}
	}

	// check writable
	try {
		await writable(path)
	} catch (err: any) {
		throw new Errlop(`no write permission for the existing file: ${path}`, err)
	}

	// attempt write
	try {
		await write(path, contents, mode)
	} catch (err: any) {
		throw new Errlop(
			`failed to write the existing and writable file: ${path}`,
			err,
		)
	}
}

/** Delete a file */
export function unlink(path: string): Promise<void> {
	return new Promise(function (resolve, reject) {
		_unlink(path, function (err) {
			if (err)
				return reject(new Errlop(`failed to delete file at: ${path}`, err))
			return resolve()
		})
	})
}

/** Delete a file safely */
export async function deleteFile(path: string): Promise<void> {
	// check exists
	try {
		await exists(path)
	} catch (err: any) {
		// if it doesn't exist, then we don't care
		return
	}

	// check writable
	try {
		await writable(path)
	} catch (err: any) {
		if (err.code === 'ENOENT') {
			// if it doesn't exist, then we don't care
			// this may not seem necessary, however it is
			// testen would fail on @bevry/json otherwise
			return
		}
		throw new Errlop(
			`no write permission to delete the existing file: ${path}`,
			err,
		)
	}

	// attempt delete
	try {
		await unlink(path)
	} catch (err: any) {
		if (err.code === 'ENOENT') {
			// if it didn't exist, then we don't care
			// this may not seem necessary, however it is
			// testen would fail on @bevry/json otherwise
			return
		}
		throw new Errlop(
			`failed to delete the existing and writable file: ${path}`,
			err,
		)
	}
}

/** Read a directory */
export function readdir(path: string): Promise<Array<string>> {
	return new Promise(function (resolve, reject) {
		_readdir(path, function (err, files) {
			if (err) return reject(new Errlop(`failed to read file at: ${path}`, err))
			return resolve(files)
		})
	})
}

/** Read a directory safely */
export async function readDirectory(path: string): Promise<Array<string>> {
	// check exists
	try {
		await exists(path)
	} catch (err: any) {
		throw new Errlop(`unable to read the non-existent directory: ${path}`, err)
	}

	// check readable
	try {
		await readable(path)
	} catch (err: any) {
		throw new Errlop(`no read permission for the directory: ${path}`, err)
	}

	// attempt read
	try {
		return await readdir(path)
	} catch (err: any) {
		throw new Errlop(
			`failed to read the existing and readable directory: ${path}`,
			err,
		)
	}
}
