using Microsoft.EntityFrameworkCore.Query;
using Repositories.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Interfaces
{
    public interface IDBRepository
    {

        #region Create

        Task<T> AddAsync<T>(T entity, bool saveChange = false, bool needAuditor = true) where T : class;

        Task<int> AddRangeAsync<T>(IEnumerable<T> entities, bool saveChange = false) where T : class;

        Task BulkAddAsync<T>(IEnumerable<T> source) where T : class;
        #endregion

        #region Retrieve        
        Task<T> GetPureAsync<T>(Expression<Func<T, bool>> predicate, List<string> navProps = null) where T : class;
        IQueryable<T> FilterPureAsync<T>(Expression<Func<T, bool>> predicate, List<string> navProps = null) where T : class;
        Task<T> GetAsync<T>(Expression<Func<T, bool>> predicate, bool tracking = false) where T : class;
        IQueryable<T> GetAllWithNoTrackingAsync<T>(Expression<Func<T, bool>> predicate = null) where T : class;
        IQueryable<T> GetAllWithTrackingAsync<T>(Expression<Func<T, bool>> predicate = null) where T : class;
        Task<TResult> GetWithSelectorAsync<T, TResult>(Expression<Func<T, bool>> predicate, Expression<Func<T, TResult>> selector) where T : class;
        IQueryable<TResult> GetAllWithSelectorQueryable<T, TResult>(Expression<Func<T, bool>> predicate, Expression<Func<T, TResult>> selector) where T : class;
        Task<List<TResult>> GetAllWithSelectorAsync<T, TResult>(Expression<Func<T, bool>> predicate, Expression<Func<T, TResult>> selector) where T : class;
        Task<List<T>> GetAllWithAsync<T>(Expression<Func<T, bool>> predicate) where T : class;
        Task<TableInfo<T>> GetAllWithPagingAsync<T, TResult>(TableQueryParameter<T, TResult> queryParameter) where T : class;
        Task<TableInfo<T>> GetAllPureWithPagingAsync<T, TResult>(TableQueryParameter<T, TResult> queryParameter, List<string> props = null) where T : class;
        Task<TableInfo<T>> GetAllWithClientPagingAsync<T, TResult>(TableQueryParameter<T, TResult> queryParameter) where T : class;
        Task<bool> AnyAsync<T>(Expression<Func<T, bool>> predicate) where T : class;
        #endregion

        #region Update        
        Task<int> UpdateAsync<T>(T entity, bool saveChange = false, bool needAuditor = true) where T : class;
        Task<int> UpdateRangeAsync<T>(IEnumerable<T> entities, bool saveChange = false) where T : class;

        Task<int> UpdateRangeWithoutAuditAsync<T>(IEnumerable<T> entities, bool saveChange = false) where T : class;

        Task<int> UpdateRangeAsync<T>(List<T> entities, int step, bool saveChange = false) where T : class;
        // Task BatchUpdateAsync<T>(IEnumerable<T> items, Action<UpdateSpecification<T>> updateSpecification, bool needAuditor = true) where T : class;

        Task BulkUpdateAsync<T>(IEnumerable<T> source) where T : class;

        Task BulkUpdateAsync<T>(Expression<Func<T, bool>> whereCondition,
            Expression<Func<SetPropertyCalls<T>, SetPropertyCalls<T>>> setPropertyCalls) where T : class;

        // Task BulkUpdateAsync<S, T>(IEnumerable<S> source, Expression<Func<T, S, bool>> joinCondition, Expression<Func<Tuple<S, T>, T>> setter, bool needAuditor = true)
        //     where S : class
        //     where T : class;
        #endregion

        #region Delete        
        Task<int> DeleteAsync<T>(T entity, bool saveChange = false) where T : class;
        Task<int> DeleteRangeAsync<T>(IEnumerable<T> entities, bool saveChange = false) where T : class;
        Task<int> DeleteRangeWithoutAuditAsync<T>(IEnumerable<T> entities, bool saveChange = false) where T : class;
        Task<int> DeleteAsync<T>(Expression<Func<T, bool>> predicate) where T : class;
        #endregion

        #region BySql

        //IQueryable<T> FromSql<T>(string sql, params object[] param) where T : class;

        //IQueryable<T> FromSql<T>(string formattedSql) where T : class;

        List<T> SqlQuery<T>(string sql, params object[] param);

        //int ExecuteSqlCommand(string sql, params object[] param);

        //int ExecuteSqlCommand(string formattedSql);

        #endregion

        #region Others        
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default(CancellationToken));

        #endregion

        public WebTicketDbContext Context { get; }
    }
}
